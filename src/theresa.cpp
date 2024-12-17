#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

#include "server.hpp"

int main()
{
    std::vector<Socket> sockets(3);
    create_server_socket(MAIN_PORT, &sockets[0]);
    create_server_socket(HTTP_PORT, &sockets[1]);
    create_server_socket(WEBSOCKET_PORT, &sockets[2]);

    Client *clients = nullptr;
    size_t clients_size = 0;

    while(true)
    {
        listener(sockets.data(), sockets.size(), &clients, &clients_size);
    }
    return 0;
}
