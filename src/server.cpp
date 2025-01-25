#include <nlohmann/json.hpp>
#include <cstring>
#include <iostream>

#include "server.hpp"
#include "discord.hpp"

using json = nlohmann::json;

ServerData server_data;

void get_js_ws_sockets(int **sockets, size_t *sockets_size)
{
    std::vector<int> v_sockets;
    for(size_t i = 0; i < server_data.clients_size; i++)
        if(server_data.clients[i].type == TYPE_WS)
            v_sockets.push_back(server_data.clients[i].sockfd);

    *sockets = new int[v_sockets.size()];
    for(size_t i = 0; i < v_sockets.size(); i++)
        (*sockets)[i] = v_sockets[i];
    *sockets_size = v_sockets.size();
}

void process_ws(int client_sockfd, char *data)
{
    DecodedWsFrame result;
    result.sender = client_sockfd;
    decode_ws_frame((unsigned char*)data, &result);

    if(result.binary_data_length == -1) return; // error

    if(result.data_type == OPCODE_TEXT)
    {
        std::cout << client_sockfd << " -> text[" << result.text_data.size() << "]" << std::endl;
        json object;
        try
        {
            object = json::parse(result.text_data);

            if( !object.contains("command_type")
                || !object.contains("datas")
                || !object.contains("subcommand")) return;

            command_type command = (command_type)object["command_type"];
            std::string datas = object["datas"].dump();

            switch(command)
            {
                case COMMAND_TYPE_DISCORD:
                    execute_discord_command((Discord::subcommand)object["subcommand"], datas.c_str());
                    break;

                default:
                    break;
            }
        }
        catch(const std::exception&)
        { }

    }
    else if(result.data_type == OPCODE_BINARY)
        std::cout << client_sockfd << " -> binary[" << result.binary_data_length << "]" << std::endl;
}

void process_http(int client_sockfd, char /* data */[], size_t /* data_size */)
{
    std::string response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nHello World !";
    send(client_sockfd, response.c_str(), response.size(), 0);
}

void init_sockets()
{
    server_data.sockets_size = 3;
    server_data.sockets = new Socket[server_data.sockets_size];
    create_server_socket(MAIN_PORT, &server_data.sockets[0]);
    create_server_socket(HTTP_PORT, &server_data.sockets[1]);
    create_server_socket(WEBSOCKET_PORT, &server_data.sockets[2]);
}

ServerData *get_server_data()
{
    return &server_data;
}

void listener()
{
    fd_set fd;
    FD_ZERO(&fd);

    size_t &sockets_size = server_data.sockets_size;
    size_t &clients_size = server_data.clients_size;
    Socket *&sockets = server_data.sockets;
    Client *&clients = server_data.clients;

    int max_socket = -1;
    for(size_t i = 0; i < sockets_size; i++)
    {
        FD_SET(sockets[i].sockfd, &fd);
        if(max_socket < sockets[i].sockfd)
            max_socket = sockets[i].sockfd;
    }
    for(size_t i = 0; i < clients_size; i++)
    {
        FD_SET(clients[i].sockfd, &fd);
        if(max_socket < clients[i].sockfd)
            max_socket = clients[i].sockfd;
    }

    int result_select = select(max_socket + 1, &fd, NULL, NULL, NULL);
    if(result_select > 0)
    {
        // Server sockets
        for(size_t i = 0; i < sockets_size; i++)
        {
            Socket &socket = sockets[i];
            if( FD_ISSET(socket.sockfd, &fd) )
            {
                socklen_t addr_length = sizeof(socket.addr);
                int accept_result = accept(socket.sockfd, (sockaddr*)&socket.addr, &addr_length);
                if(accept_result > 0)
                {
                    Client new_client;
                    new_client.sockfd = accept_result;
                    switch(socket.port)
                    {
                        case MAIN_PORT:
                            new_client.type = TYPE_GLOBAL;
                            break;
                        case HTTP_PORT:
                        {
                            new_client.type = TYPE_HTTP;
                            break;
                        }
                        case WEBSOCKET_PORT:
                        {
                            new_client.type = TYPE_WS;
                            // send appropriate header immediatly
                            char buffer[WS_BUFFER_SIZE];
                            long result = recv(new_client.sockfd, buffer, WS_BUFFER_SIZE, 0);
                            buffer[result] = '\0';
                            std::string response_header = generate_handshake_header(buffer);
                            send(new_client.sockfd, response_header.c_str(), response_header.size(), 0);
                            break;
                        }
                        default:
                            break;
                    }
                    if(clients != nullptr)
                    {
                        Client *new_clients = new Client[clients_size + 1];
                        std::memcpy(new_clients, clients, sizeof(Client) * clients_size);
                        new_clients[clients_size] = new_client;
                        ++clients_size;
                        delete [] clients;
                        clients = new_clients;
                    }
                    else
                    {
                        clients = new Client[clients_size + 1];
                        clients[0] = new_client;
                        ++clients_size;
                    }
                }
            }
        }
        
        // Client sockets
        for(size_t i = 0; i < clients_size; i++)
        {
            Client &client = clients[i];
            if( FD_ISSET(client.sockfd, &fd) )
            {
                char buffer[WS_BUFFER_SIZE];
                ssize_t recv_result = recv(client.sockfd, buffer, WS_BUFFER_SIZE, 0);

                if(recv_result > 0)
                {
                    if(recv_result != WS_BUFFER_SIZE) buffer[recv_result] = '\0';

                    switch(client.type)
                    {
                        case TYPE_GLOBAL:
                            break;
                        case TYPE_HTTP:
                            process_http(client.sockfd, buffer, recv_result);
                            break;
                        case TYPE_WS:
                            process_ws(client.sockfd, buffer);
                            break;
                    }
                }
                else
                {
                    if(clients_size == 1)
                    {
                        delete [] clients; clients = nullptr;
                        --clients_size;
                    }
                    else
                    {
                        Client *new_clients = new Client[clients_size - 1];
                        std::memcpy(new_clients, clients, sizeof(Client) * i);
                        std::memcpy(new_clients + i, clients, sizeof(Client) * (clients_size + i - 1));
                        delete [] clients;
                        clients = new_clients;
                        --clients_size;
                    }
                    i--;
                }
            }
        }
    }
}