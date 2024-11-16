#include <iostream>
#include <mutex>
#include <thread>
#include <sys/socket.h>
#include <netinet/in.h>
#include <string.h>

#include "web_socket.hpp"

int main()
{
    sockaddr_in addr;
    int sockfd;

    memset(&(addr.sin_zero), 0, 8);

    sockfd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    const char param_value = '1';
    setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &param_value, sizeof(param_value));
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(55000);
    addr.sin_family = AF_INET;
    bind(sockfd, (sockaddr*)&addr, sizeof(addr));
    listen(sockfd, 1);

    fd_set fd;
    std::mutex listener_lock;

    struct Client {
        int sockfd;
    };

    std::vector<Client> clients;
    timeval tv;
    tv.tv_sec = 0;
    tv.tv_usec = 1 * 1000;

    while(true)
    {
        listener_lock.lock();

        FD_ZERO(&fd);
        int max_socket = -1;
        max_socket = sockfd;
        FD_SET(sockfd, &fd);
        for(Client client : clients)
            if(max_socket < client.sockfd)
            {
                FD_SET(client.sockfd, &fd);
                max_socket = client.sockfd;
            }

        if( select(max_socket + 1, &fd, NULL, NULL, &tv) > 0 )
        {
            if( FD_ISSET(sockfd, &fd) )
            {
                char buffer[BUFFER_SIZE];
                int new_client_socket = accept(sockfd, nullptr, nullptr);
                clients.push_back({new_client_socket});

                int recv_size = recv(new_client_socket, buffer, BUFFER_SIZE, 0);
                if(recv_size < BUFFER_SIZE) buffer[recv_size] = '\0';

                std::string handshake_header = generate_handshake_header(buffer);
                send(new_client_socket, handshake_header.c_str(), handshake_header.length(), 0);
            }

            for(size_t i = 0; i < clients.size(); i++)
                if( FD_ISSET(clients[i].sockfd, &fd) )
                {
                    DecodedData datas = decode_data(clients[i].sockfd);
                    if(datas.data_type == OPCODE_TEXT)
                    {
                        if(datas.text_data == "Oui")
                        {
                            send_encoded_message("Non", clients[i].sockfd, false);
                        }
                        std::cout << datas.text_data << std::endl;
                    }
                }
        }

        listener_lock.unlock();
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
    return 0;
}
