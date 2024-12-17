#include <string.h>

#include <socket_mgr.hpp>

void create_server_socket(int port, Socket *new_socket)
{
    memset(&new_socket->addr, 0, 8);
    new_socket->port = port;
    new_socket->sockfd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    int param_value = 1;
    if(setsockopt(new_socket->sockfd, SOL_SOCKET, SO_REUSEADDR, &param_value, sizeof(param_value)) < 0)
        return;
    new_socket->addr.sin_addr.s_addr = INADDR_ANY;
    new_socket->addr.sin_port = htons(port);
    new_socket->addr.sin_family = AF_INET;
    if(bind(new_socket->sockfd, (struct sockaddr*)&new_socket->addr, sizeof(new_socket->addr)) < 0)
        return;
    if(listen(new_socket->sockfd, 1) < 0)
        return;
}
