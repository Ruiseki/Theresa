#include "server.hpp"

void process_ws(const char data[], size_t data_size)
{

}

void listener(std::vector<Socket> *sockets)
{
    typedef int conn_type;
    #define TYPE_GLOBAL 0x0000
    #define TYPE_HTTP   0x0001
    #define TYPE_WS     0x0002

    fd_set fd;
    struct Client {
        int sockfd;
        conn_type type;
    };
    std::vector<Client> clients;

    FD_ZERO(&fd);
    int max_socket = -1;
    for(Socket socket : *sockets)
    {
        FD_SET(socket.sockfd, &fd);
        if(max_socket < socket.sockfd)
            max_socket = socket.sockfd;
    }

    int result_select = select(max_socket + 1, &fd, NULL, NULL, NULL);
    if(result_select > 0)
    {
        for(Socket socket : *sockets)
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
                            new_client.type = TYPE_HTTP;
                            break;
                        case WEBSOCKET_PORT:
                            new_client.type = TYPE_WS;
                            break;
                        default:
                            break;
                    }
                    clients.push_back(new_client);
                }
            }
        for(size_t i = 0; i < clients.size(); i++)
        {
            Client &client = clients[i];
            if( FD_ISSET(client.sockfd, &fd) )
            {
                const int buffer_size = 8192;
                char buffer[buffer_size];
                std::vector<const char> data;

                int recv_result;
                do
                {
                    recv_result = (client.sockfd, buffer, buffer_size, 0);
                    
                } while(recv_result == buffer_size); // Possible lock when the data size is equal to buffer_size. Need to test

                if(recv_result > 0)
                {
                    if(recv_result != buffer_size) buffer[recv_result] = '\0';

                    switch(client.type)
                    {
                        case TYPE_GLOBAL:
                            break;
                        case TYPE_HTTP:
                            break;
                        case TYPE_WS:
                            process_ws(data.data(), data.size());
                            break;
                    }
                }
                else
                {
                    clients.erase(clients.begin() + i);
                    i--;
                }
            }
        }
    }
}