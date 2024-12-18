#include <cstring>
#include <sstream>
#include <openssl/sha.h>
#include <openssl/evp.h>
#include <sys/socket.h>

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

std::vector<char> encode_ws_trame(const char *data, size_t data_size, bool masked)
{
    std::vector<char> ws_trame;
 
    ws_trame.push_back(char(FIN_TERMINATE | OPCODE_TEXT)); //1000 0001
    
    if(data_size < 126)
    {
        if(masked)
            ws_trame.push_back(char(data_size & 0x7F) | 0x80);
        else
            ws_trame.push_back(char(data_size & 0x7F));
    }
    else if(data_size < 65535)
    {
        if(masked)
            ws_trame.push_back(char(126) | 0x80);
        else
            ws_trame.push_back(char(126));

        for(int i = 0; i < 16; i += 8)
            ws_trame.push_back(char(data_size >> i));
    }
    else
    {
        if(masked)
            ws_trame.push_back(char(127) | 0x80);
        else
            ws_trame.push_back(char(127));

        for(int i = 0; i < 64; i+= 8)
            ws_trame.push_back(char(data_size >> i));
    }

    if(masked)
    {
        unsigned char mask[4];
        char *masked_data = new char[data_size];;
        for(int i = 0; i < 4; i++){
            mask[i] = std::rand() % 255;
            ws_trame.push_back(mask[i]);
        }
        for (size_t i = 0; i < data_size; i++) {
            masked_data[i] ^= mask[i % 4];  // Apply masking
            ws_trame.push_back(masked_data[i]);
        }       
    }
    else
    {
        for(size_t i = 0; i < data_size; i++)
            ws_trame.push_back(data[i]);
    }

    return ws_trame;
}

std::vector<char> encode_ws_trame(const char *data, size_t data_size)
{
    return encode_ws_trame(data, data_size, false);
}

std::vector<char> encode_ws_trame(std::string data, bool masked)
{
    return encode_ws_trame(data.c_str(), data.size(), masked);
}

std::vector<char> encode_ws_trame(std::string data)
{
    return encode_ws_trame(data, false);
}

void decode_ws_trame(unsigned char *data, DecodedWsTrame *result)
{
    unsigned long payload_size;
    int selected_byte; // for keeping track of where we are in *data
    bool is_masked;

    // First 2 bytes
    // FIN, RSVx, opcode, MASKED, Payload len
    // -------------------------------
    result->end =       data[WS_TRAME_POS_FIN]          & WS_TRAME_MSK_FIN;
    result->data_type = data[WS_TRAME_POS_OPCODE]       & WS_TRAME_MSK_OPCODE;
    is_masked =         data[WS_TRAME_POS_MASK]         & WS_TRAME_MSK_MASK;
    payload_size =      data[WS_TRAME_POS_PAYLOADLEN]   & WS_TRAME_MSK_PAYLOADLEN;
    // -------------------------------


    // Paylaod size
    // -------------------------------
    selected_byte = 2;
    if(payload_size == PAYLOAD_SIZE_16_BITS)
    {
        // 16 bits = 2 bytes
        std::memcpy(&payload_size, data + selected_byte, 2);
        payload_size >>= 8;
        selected_byte += 2;
    }
    else if(payload_size == PAYLOAD_SIZE_64_BITS)
    {
        // 64 bits = 8 bytes
        std::memcpy(&payload_size, data + selected_byte, 8);
        selected_byte += 8;
    }
    // -------------------------------


    // Get the payload
    // -------------------------------
    if(is_masked)
    {
        unsigned char mask[4];
        std::memcpy(mask, data + selected_byte, 4);
        selected_byte += 4;

        // Unmask the datas
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#exchanging_data_frames
        for (unsigned long i = 0; i < payload_size; ++i)
            data[selected_byte + i] ^= mask[i % 4];
    }

    if(result->data_type == OPCODE_TEXT)
        result->text_data.assign((char*)data + selected_byte, payload_size);
    else if(result->data_type == OPCODE_BINARY)
    {
        result->binary_data = new unsigned char[payload_size];
        std::memcpy(result->binary_data, data + selected_byte, payload_size);
        result->binary_data_length = payload_size;
    }
    // -------------------------------
}

int send_ws_trame(std::string message, int client_socket, bool masked)
{
    std::vector<char> encoded_message = encode_ws_trame(message, masked);
    return send(client_socket, encoded_message.data(), encoded_message.size(), 0);
}

int send_ws_trame(std::string message, int client_socket)
{
    return send_ws_trame(message, client_socket, true);
}
