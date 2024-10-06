#ifndef WEBSOCKET_HPP_INCLUDED
#define WEBSOCKET_HPP_INCLUDED

#include <string>
#include <vector>

#define BUFFER_SIZE 0x1000

typedef int OPCODE_T;
#define OPCODE_CONTINUE (OPCODE_T)0x0
#define OPCODE_TEXT     (OPCODE_T)0x1
#define OPCODE_BINARY   (OPCODE_T)0x2
#define OPCODE_CLOSED   (OPCODE_T)0x8
#define OPCODE_PING     (OPCODE_T)0x9
#define OPCODE_PONG     (OPCODE_T)0xA

typedef int FIN_T;
#define FIN_TERMINATE (FIN_T)0x80
#define FIN_CONTINUE  (FIN_T)0x0

struct DecodedData {
    OPCODE_T dataType;
    bool end;
    std::string textData;
    std::vector<char> binaryData;
};

std::string generateHandshakeHeader(char *clientHeader);

std::vector<char> encodeData(const char *data, size_t dataSize, bool masked);
std::vector<char> encodeData(const char *data, size_t dataSize);
std::vector<char> encodeData(std::string data, bool masked);
std::vector<char> encodeData(std::string data);

DecodedData decodeData(int sockfd);
int sendEncodedMessage(std::string message, int client_socket, bool masked);
int sendEncodedMessage(std::string message, int client_socket);

#endif // WEBSOCKET_HPP_INCLUDED