#ifndef WEBSOCKET_HPP_INCLUDED
#define WEBSOCKET_HPP_INCLUDED

#include <string>
#include <vector>

#define WS_BUFFER_SIZE 0x1000

#define PAYLOAD_SIZE_CURRENT    125
#define PAYLOAD_SIZE_16_BITS    126
#define PAYLOAD_SIZE_64_BITS    127

#define WS_FRAME_POS_FIN        0
#define WS_FRAME_POS_OPCODE     0
#define WS_FRAME_POS_MASKD      1
#define WS_FRAME_POS_PAYLOADLEN 1

#define WS_FRAME_MSK_FIN        0x80
#define WS_FRAME_MSK_OPCODE     0x0F
#define WS_FRAME_MSK_MASK       0x80
#define WS_FRAME_MSK_PAYLOADLEN 0x7F

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

struct DecodedWsFrame {
    OPCODE_T data_type;
    bool end;
    std::string text_data = "";
    unsigned char *binary_data = nullptr;
    ssize_t binary_data_length = 0;
    int sender = -1;

    ~DecodedWsFrame()
    {
        if(binary_data != nullptr)
            delete [] binary_data;
    }
};

std::string generate_handshake_header(char *client_header);

void encode_ws_frame(OPCODE_T data_type, const unsigned char *data, size_t data_size, bool masked, unsigned char **ws_frame, size_t *frame_size);
void encode_ws_frame(OPCODE_T data_type, const unsigned char *data, size_t data_size, unsigned char **ws_frame, size_t *frame_size);
void encode_ws_frame(std::string data, bool masked, unsigned char **ws_frame, size_t *frame_size);
void encode_ws_frame(std::string data, unsigned char **ws_frame, size_t *frame_size);

void decode_ws_frame(unsigned char *data, DecodedWsFrame *result);
void decode_ws_frame(DecodedWsFrame *result);
int send_ws_frame(std::string message, int client_socket, bool masked);
int send_ws_frame(std::string message, int client_socket);

#endif // WEBSOCKET_HPP_INCLUDED