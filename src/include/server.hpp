#ifndef SERVER_HPP_INCLUDED
#define SERVER_HPP_INCLUDED

typedef int THERESA_PORT;
#define MAIN_PORT       (THERESA_PORT)42840
#define HTTP_PORT       (THERESA_PORT)80
#define WEBSOCKET_PORT  (THERESA_PORT)42841

#include <vector>

#include "socket_mgr.hpp"
#include "web_socket_mgr.hpp"
#include "http_mgr.hpp"

void listener(std::vector<Socket> *sockets);

#endif // SERVER_HPP_INCLUDED
