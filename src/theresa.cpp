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

    while(true)
    {
        listener(&sockets);
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
    return 0;
}
