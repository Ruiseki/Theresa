#include <string.h>

#include <socket_mgr.hpp>

void create_server_socket(int port, Socket *new_Socket)
{
    memset(&new_Socket->addr, 0, 8);
    new_Socket->sockfd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    int param_value = 1;
    setsockopt(new_Socket->sockfd, SOL_SOCKET, SO_REUSEADDR, &param_value, sizeof(param_value));
    new_Socket->addr.sin_addr.s_addr = INADDR_ANY;
    new_Socket->addr.sin_port = htons(port);
    new_Socket->addr.sin_family = AF_INET;
    bind(new_Socket->sockfd, (sockaddr*)&new_Socket->addr, sizeof(new_Socket->addr));
    listen(new_Socket->sockfd, 1);
}
