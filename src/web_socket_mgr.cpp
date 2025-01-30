#include <cstring>
#include <cstdint>
#include <sstream>
#include <openssl/sha.h>
#include <openssl/evp.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#include "web_socket_mgr.hpp"
/*
    https://developer.mozilla.org/fr/docs/Web/API/WebSockets_API/Writing_WebSocket_servers

     0               1               2               3
     0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
    +-+-+-+-+-------+-+-------------+-------------------------------+
    |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
    |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
    |N|V|V|V|       |S|             |   (if payload len==126/127)   |
    | |1|2|3|       |K|             |                               |
    +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
        4               5               6               7
    + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
    |     Extended payload length continued, if payload len == 127  |
    + - - - - - - - - - - - - - - - +-------------------------------+
        8               9               10              11
    + - - - - - - - - - - - - - - - +-------------------------------+
    |                               |Masking-key, if MASK set to 1  |
    +-------------------------------+-------------------------------+
        12              13              14              15
    +-------------------------------+-------------------------------+
    | Masking-key (continued)       |          Payload Data         |
    +-------------------------------- - - - - - - - - - - - - - - - +
    :                     Payload Data continued ...                :
    + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
    |                     Payload Data continued ...                |
    +---------------------------------------------------------------+

*/

std::string c_str_to_base_64(unsigned char const *bytes_to_encode, unsigned int in_len)
{
    size_t len_encoded = (in_len +2) / 3 * 4;
    unsigned char trailing_char = '=';
    const char* base64_chars_ = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    std::string ret;
    ret.reserve(len_encoded);

    unsigned int pos = 0;

    while (pos < in_len) {
        ret.push_back(base64_chars_[(bytes_to_encode[pos + 0] & 0xfc) >> 2]);

        if (pos+1 < in_len) {
           ret.push_back(base64_chars_[((bytes_to_encode[pos + 0] & 0x03) << 4) + ((bytes_to_encode[pos + 1] & 0xf0) >> 4)]);

           if (pos+2 < in_len) {
              ret.push_back(base64_chars_[((bytes_to_encode[pos + 1] & 0x0f) << 2) + ((bytes_to_encode[pos + 2] & 0xc0) >> 6)]);
              ret.push_back(base64_chars_[  bytes_to_encode[pos + 2] & 0x3f]);
           }
           else {
              ret.push_back(base64_chars_[(bytes_to_encode[pos + 1] & 0x0f) << 2]);
              ret.push_back(trailing_char);
           }
        }
        else {

            ret.push_back(base64_chars_[(bytes_to_encode[pos + 0] & 0x03) << 4]);
            ret.push_back(trailing_char);
            ret.push_back(trailing_char);
        }

        pos += 3;
    }


    return ret;
}

std::string generate_accept_key(std::string key)
{
    std::string magic_string = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

    unsigned char hash[20];
    SHA1(reinterpret_cast<const unsigned char*>(magic_string.c_str()), magic_string.size(), hash);

    return c_str_to_base_64(hash, 20);
}

std::string get_client_key(char* client_header)
{
    // char* truc = std::strstr(client_header, "Sec-WebSocket-Key: ");
    char* truc = std::strstr(client_header, "sec-websocket-key: ");
    if(truc == nullptr)
        truc = std::strstr(client_header, "Sec-WebSocket-Key: ");
    std::string key;
    int key_pos = (truc - client_header) + 19;

    for(int i = 0; client_header[key_pos + i] != '\r'; i++){
        key += client_header[key_pos + i];
    }

    return key;
}

std::string generate_handshake_header(char *client_header)
{    
    std::string client_key = get_client_key(client_header);
    std::string accept_key = generate_accept_key(client_key);

    std::stringstream accept_key_header_stream;
    accept_key_header_stream << "HTTP/1.1 101 Switching Protocols\r\n";
    accept_key_header_stream << "Upgrade: websocket\r\n";
    accept_key_header_stream << "Connection: Upgrade\r\n";
    accept_key_header_stream << "Sec-WebSocket-Accept: " << accept_key << "\r\n\r\n";

    std::string handshake_header = accept_key_header_stream.str();
    return handshake_header;
}

unsigned long long swap_endian_64(unsigned long long value)
{
    unsigned long long result = 0;

    for (size_t i = 0; i < 8; i++)
        reinterpret_cast<uint8_t*>(&result)[i] = reinterpret_cast<uint8_t*>(&value)[8 - 1 - i];

    return result;
}

void encode_ws_frame(OPCODE_T data_type, const unsigned char *data, size_t data_size, bool masked, unsigned char **ws_frame, size_t *frame_size)
{
    *frame_size = 2; // Size of the frame in bytes.
    unsigned char *&frame = *ws_frame;

    if(data_size > 0xFFFF)      *frame_size += 8;
    else if(data_size >= 0x7E)  *frame_size += 2;
    if(masked) *frame_size += 4;
    *frame_size += data_size;
    frame = new unsigned char[*frame_size];
    for(size_t i = 0; i < *frame_size; i++)
        frame[i] = 0;

    // First 2 bytes
    // FIN, RSVx, opcode, MASKED, Payload len
    // -------------------------------
    frame[WS_FRAME_POS_FIN]          += FIN_TERMINATE;
    frame[WS_FRAME_POS_OPCODE]       += data_type;
    frame[WS_FRAME_POS_MASKD]         += masked ? 0x80 : 0;
    frame[WS_FRAME_POS_PAYLOADLEN]   += data_size > 0xFFFF
                                            ? PAYLOAD_SIZE_64_BITS
                                            : data_size >= 0x7E
                                                ? PAYLOAD_SIZE_16_BITS
                                                : data_size;
    // -------------------------------
    
    // Paylaod size
    // -------------------------------
    size_t big_endian_size = ntohs(data_size);
    if((frame[WS_FRAME_POS_PAYLOADLEN] & 0x7F) == PAYLOAD_SIZE_16_BITS)
        // 16 bits = 2 bytes
        std::memcpy(&frame[WS_FRAME_POS_PAYLOADLEN] + 1, &big_endian_size, 2);
    else if((frame[WS_FRAME_POS_PAYLOADLEN] & 0x7F) == PAYLOAD_SIZE_64_BITS)
        // 64 bits = 8 bytes
        std::memcpy(&frame[WS_FRAME_POS_PAYLOADLEN] + 1, &big_endian_size, 8);
    // -------------------------------

    // Masking and set the payload
    // -------------------------------
    if(masked)
    {
        for(int i = 0; i < 4; i++)
            frame[WS_FRAME_POS_MASKD + i] = std::rand() % 255;

        // https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#exchanging_data_frames
        // Mask the datas
        for(size_t i = 0; i < data_size; i++)
            frame[*frame_size - data_size + i] ^= frame[WS_FRAME_POS_MASKD + (i % 4)]; // meh
    }
    else
        for(size_t i = 0; i < data_size; i++)
            frame[*frame_size - data_size + i] = data[i];
    // -------------------------------
}

void encode_ws_frame(OPCODE_T data_type, const unsigned char *data, size_t data_size, unsigned char **ws_frame, size_t *frame_size)
{ encode_ws_frame(data_type, data, data_size, false, ws_frame, frame_size); }

void encode_ws_frame(std::string data, bool masked, unsigned char **ws_frame, size_t *frame_size)
{ encode_ws_frame(OPCODE_TEXT, (unsigned char*)data.c_str(), data.size(), masked, ws_frame, frame_size); }

void encode_ws_frame(std::string data, unsigned char **ws_frame, size_t *frame_size)
{ encode_ws_frame(data, false, ws_frame, frame_size); }

void decode_ws_frame(unsigned char *ws_frame_buffer, DecodedWsFrame *result)
{
    unsigned long long payload_size;
    int selected_byte;  // for keeping track of where we are in *data
    int mask_pos;       // position of the mask is variable because of the paylaod size
    bool is_masked;
    unsigned char *ws_frame;

    // First 2 bytes
    // FIN, RSVx, opcode, MASKED, Payload len
    // -------------------------------
    result->end =       ws_frame_buffer[WS_FRAME_POS_FIN]          & WS_FRAME_MSK_FIN;
    result->data_type = ws_frame_buffer[WS_FRAME_POS_OPCODE]       & WS_FRAME_MSK_OPCODE;
    is_masked =         ws_frame_buffer[WS_FRAME_POS_MASKD]        & WS_FRAME_MSK_MASK;
    payload_size =      ws_frame_buffer[WS_FRAME_POS_PAYLOADLEN]   & WS_FRAME_MSK_PAYLOADLEN;
    // -------------------------------

    // Paylaod size
    // -------------------------------
    selected_byte = 2;
    if(payload_size == PAYLOAD_SIZE_16_BITS)
    {
        // 16 bits = 2 bytes
        std::memcpy(&payload_size, ws_frame_buffer + selected_byte, 2);
        payload_size = ntohs(payload_size);
        selected_byte += 2;
    }
    else if(payload_size == PAYLOAD_SIZE_64_BITS)
    {
        // 64 bits = 8 bytes
        std::memcpy(&payload_size, ws_frame_buffer + selected_byte, 8);
        #if __BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__
            payload_size = swap_endian_64(payload_size);
        #endif
        selected_byte += 8;
    }
    // -------------------------------

    // If masked, payload is 4 bytes next
    // -------------------------------
    mask_pos = selected_byte;
    if(is_masked)
        selected_byte += 4;
    // -------------------------------

    // Get the full frame
    // -------------------------------
    ws_frame = new unsigned char[selected_byte + payload_size];
    if(selected_byte + payload_size > WS_BUFFER_SIZE)
    {
        std::memcpy(ws_frame, ws_frame_buffer, WS_BUFFER_SIZE);
        unsigned long long recvd_bytes = WS_BUFFER_SIZE;

        while(recvd_bytes != selected_byte + payload_size)
        {
            ssize_t recv_result = recv(result->sender, ws_frame + recvd_bytes, WS_BUFFER_SIZE, 0);

            if(recv_result <= 0)
            {
                result->binary_data_length = -1;
                return;
            }

            recvd_bytes += recv_result;
        }
    }
    else
        std::memcpy(ws_frame, ws_frame_buffer, selected_byte + payload_size);
    // -------------------------------

    // Get the payload
    // -------------------------------
    if(is_masked)
    {
        // Unmask the datas
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#exchanging_data_frames
        for (unsigned long i = 0; i < payload_size; ++i)
            ws_frame[selected_byte + i] ^= ws_frame[mask_pos + (i % 4)];
    }

    if(result->data_type == OPCODE_TEXT)
        result->text_data.assign((char*)ws_frame + selected_byte, payload_size);
    else if(result->data_type == OPCODE_BINARY)
    {
        result->binary_data = new unsigned char[payload_size];
        std::memcpy(result->binary_data, ws_frame + selected_byte, payload_size);
        result->binary_data_length = payload_size;
    }
    // -------------------------------

    delete [] ws_frame;
}

void decode_ws_frame(DecodedWsFrame *result)
{
    unsigned char buffer[WS_BUFFER_SIZE];
    if( recv(result->sender, buffer, WS_BUFFER_SIZE, 0) <= 0 )
        result->binary_data_length = -1;
    else
        decode_ws_frame(buffer, result);
}

int send_ws_frame(std::string message, int client_socket, bool masked)
{
    unsigned char *ws_frame;
    size_t frame_size;
    encode_ws_frame(message, masked, &ws_frame, &frame_size);
    return send(client_socket, ws_frame, frame_size, 0);
}

int send_ws_frame(std::string message, int client_socket)
{ return send_ws_frame(message, client_socket, false); }
