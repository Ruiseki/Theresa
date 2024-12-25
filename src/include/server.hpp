#ifndef SERVER_HPP_INCLUDED
#define SERVER_HPP_INCLUDED

typedef int theresa_port;
#define MAIN_PORT       (theresa_port)42840
#define HTTP_PORT       (theresa_port)8080
#define WEBSOCKET_PORT  (theresa_port)42841

typedef int conn_type;
#define TYPE_GLOBAL (conn_type)0
#define TYPE_HTTP   (conn_type)1
#define TYPE_WS     (conn_type)2

typedef int command_type;
#define COMMAND_TYPE_DISCORD    (command_type)0
#define COMMAND_TYPE_APP        (command_type)1
#define COMMAND_TYPE_WEB        (command_type)2

#include <vector>

#include "socket_mgr.hpp"
#include "web_socket_mgr.hpp"
#include "http_mgr.hpp"

struct Client {
    int sockfd;
    conn_type type;
};

struct ServerData {
    Socket *sockets = nullptr;
    Client *clients = nullptr;
    size_t sockets_size = 0;
    size_t clients_size = 0;
};

ServerData *get_server_data();
void init_server_data();
void listener();

#endif // SERVER_HPP_INCLUDED
