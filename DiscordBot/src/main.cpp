#include <iostream>
#include <mutex>
#include <thread>

#include "webSocket.hpp"

#ifndef __linux__
    #include <winsock2.h>
    #include <windows.h>
    #include <ws2tcpip.h>
#endif

int main()
{
    WSADATA ws;
    sockaddr_in addr;
    int sockfd;

    memset(&(addr.sin_zero), 0, 8);
    WSAStartup(MAKEWORD(2, 2), &ws);

    sockfd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    const char param_value = '1';
    setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &param_value, sizeof(param_value));
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(55000);
    addr.sin_family = AF_INET;
    bind(sockfd, (sockaddr*)&addr, sizeof(addr));
    listen(sockfd, 1);

    fd_set fd;
    std::mutex listenerLock;

    struct Client {
        int sockfd;
    };

    std::vector<Client> clients;
    timeval tv;
    tv.tv_sec = 0;
    tv.tv_usec = 1 * 1000;

    while(true)
    {
        listenerLock.lock();

        FD_ZERO(&fd);
        int maxSocket = -1;
        maxSocket = sockfd;
        FD_SET(sockfd, &fd);
        for(Client client : clients)
            if(maxSocket < client.sockfd)
            {
                FD_SET(client.sockfd, &fd);
                maxSocket = client.sockfd;
            }

        if( select(maxSocket + 1, &fd, NULL, NULL, &tv) > 0 )
        {
            if( FD_ISSET(sockfd, &fd) )
            {
                char buffer[BUFFER_SIZE];
                int newClientSocket = accept(sockfd, nullptr, nullptr);
                clients.push_back({newClientSocket});

                int recvSize = recv(newClientSocket, buffer, BUFFER_SIZE, 0);
                if(recvSize < BUFFER_SIZE) buffer[recvSize] = '\0';

                std::string handshakeHeader = generateHandshakeHeader(buffer);
                send(newClientSocket, handshakeHeader.c_str(), handshakeHeader.length(), 0);
            }

            for(size_t i = 0; i < clients.size(); i++)
                if( FD_ISSET(clients[i].sockfd, &fd) )
                {
                    DecodedData datas = decodeData(clients[i].sockfd);
                    if(datas.dataType == OPCODE_TEXT)
                    {
                        if(datas.textData == "Oui")
                        {
                            sendEncodedMessage("Non", clients[i].sockfd, false);
                        }
                        std::cout << datas.textData << std::endl;

                    }
                }
        }

        listenerLock.unlock();
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
    return 0;
}
