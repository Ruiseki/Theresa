#include <cstring>
#include <sstream>

#include <openssl/sha.h>
#include <openssl/evp.h>

#ifndef __linux__
    #include <winsock2.h>
#endif

#include "web_socket.hpp"

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
    char* truc = std::strstr(client_header, "Sec-WebSocket-Key: ");
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

std::vector<char> encode_data(const char *data, size_t data_size, bool masked)
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

std::vector<char> encode_data(const char *data, size_t data_size)
{
    return encode_data(data, data_size, false);
}

std::vector<char> encode_data(std::string data, bool masked)
{
    return encode_data(data.c_str(), data.size(), masked);
}

std::vector<char> encode_data(std::string data)
{
    return encode_data(data, false);
}

DecodedData decode_data(int sockfd)
{
    DecodedData result;
    bool is_last_trame, is_masked;
    int payload_size, data_type;
    char *payload;
    unsigned char *buffer;

    buffer = new unsigned char[2];
    recv(sockfd, (char*)buffer, 2, 0);
    is_last_trame = buffer[0] & 0x80;
    data_type = buffer[0] & 0x0F;
    is_masked = buffer[1] & 0x80;
    payload_size = buffer[1] & 0x7F;
    delete [] buffer;

    if(payload_size == 126)
    {
        buffer = new unsigned char[2];
        recv(sockfd, (char*)buffer, 2, 0);
        payload_size = (buffer[0] << 8) | buffer[1];
        delete [] buffer;
    }
    else if(payload_size == 127)
    {
        buffer = new unsigned char[8];
        recv(sockfd, (char*)buffer, 8, 0);
        payload_size = 0;
        for(int i = 0; i < 8; i++)
            payload_size |= buffer[i] << (64 - (i + 1) * 8);
        delete [] buffer;
    }

    payload = new char[payload_size];
    payload[payload_size] = '\0';

    if(is_masked)
    {
        buffer = new unsigned char[4];
        recv(sockfd, (char*)buffer, 4, 0);
        recv(sockfd, (char*)payload, payload_size, 0);

        for (int i = 0; i < payload_size; ++i) {
            payload[i] ^= buffer[i % 4];  // Apply masking
        }

        delete [] buffer;
    }
    else recv(sockfd, (char*)payload, payload_size, 0);

    result.end = is_last_trame;
    result.data_type = data_type;
    if(data_type == OPCODE_BINARY)
        result.binary_data.assign(payload, payload + payload_size);
    else
        result.text_data = payload;

    delete [] payload;

    return result;
}

int send_encoded_message(std::string message, int client_socket, bool masked)
{
    std::vector<char> encoded_message = encode_data(message, masked);
    return send(client_socket, encoded_message.data(), encoded_message.size(), 0);
}

int send_encoded_message(std::string message, int client_socket)
{
    return send_encoded_message(message, client_socket, true);
}
