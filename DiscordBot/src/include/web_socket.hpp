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
    OPCODE_T data_type;
    bool end;
    std::string text_data;
    std::vector<char> binary_data;
};

std::string generate_handshake_header(char *client_header);

std::vector<char> encode_data(const char *data, size_t data_size, bool masked);
std::vector<char> encode_data(const char *data, size_t data_size);
std::vector<char> encode_data(std::string data, bool masked);
std::vector<char> encode_data(std::string data);

DecodedData decode_data(int sockfd);
int send_encoded_message(std::string message, int client_socket, bool masked);
int send_encoded_message(std::string message, int client_socket);

#endif // WEBSOCKET_HPP_INCLUDED