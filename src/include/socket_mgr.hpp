#ifndef SOCKET_MGR_HPP_INCLUDED
#define SOCKET_MGR_HPP_INCLUDED

#include <sys/socket.h>
#include <netinet/in.h>

struct Socket {
    int sockfd;
    int port = -1;
    sockaddr_in addr;
};

void create_server_socket(int port, Socket *new_Socket);

#endif // SOCKET_MGR_HPP_INCLUDED
