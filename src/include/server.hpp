#ifndef SERVER_HPP_INCLUDED
#define SERVER_HPP_INCLUDED

typedef int THERESA_PORT;
#define MAIN_PORT       (THERESA_PORT)42840
#define HTTP_PORT       (THERESA_PORT)8080
#define WEBSOCKET_PORT  (THERESA_PORT)42841

typedef int conn_type;
#define TYPE_GLOBAL 0x0000
#define TYPE_HTTP   0x0001
#define TYPE_WS     0x0002

struct Client {
    int sockfd;
    conn_type type;
};

#include <vector>

#include "socket_mgr.hpp"
#include "web_socket_mgr.hpp"
#include "http_mgr.hpp"

void listener(Socket sockets[], size_t sockets_size, Client **clients, size_t *clients_size);

#endif // SERVER_HPP_INCLUDED
