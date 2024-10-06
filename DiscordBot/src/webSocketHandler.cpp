#include <cstring>
#include <sstream>

#include <openssl/sha.h>
#include <openssl/evp.h>

#ifndef __linux__
    #include <winsock2.h>
#endif

#include "webSocket.hpp"

std::string c_strToBase64(unsigned char const *bytes_to_encode, unsigned int in_len)
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

std::string generateAcceptKey(std::string key)
{
    std::string magicString = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

    unsigned char hash[20];
    SHA1(reinterpret_cast<const unsigned char*>(magicString.c_str()), magicString.size(), hash);

    return c_strToBase64(hash, 20);
}

std::string getClientKey(char* clientHeader)
{
    char* truc = std::strstr(clientHeader, "Sec-WebSocket-Key: ");
    std::string key;
    int keyPos = (truc - clientHeader) + 19;

    for(int i = 0; clientHeader[keyPos + i] != '\r'; i++){
        key += clientHeader[keyPos + i];
    }

    return key;
}

std::string generateHandshakeHeader(char *clientHeader)
{    
    std::string clientKey = getClientKey(clientHeader);
    std::string acceptKey = generateAcceptKey(clientKey);

    std::stringstream acceptKeyHeaderStream;
    acceptKeyHeaderStream << "HTTP/1.1 101 Switching Protocols\r\n";
    acceptKeyHeaderStream << "Upgrade: websocket\r\n";
    acceptKeyHeaderStream << "Connection: Upgrade\r\n";
    acceptKeyHeaderStream << "Sec-WebSocket-Accept: " << acceptKey << "\r\n\r\n";

    std::string handshakeHeader = acceptKeyHeaderStream.str();
    return handshakeHeader;
}

std::vector<char> encodeData(const char *data, size_t dataSize, bool masked)
{
    std::vector<char> wsTrame;
 
    wsTrame.push_back(char(FIN_TERMINATE | OPCODE_TEXT)); //1000 0001
    
    if(dataSize < 126)
    {
        if(masked)
            wsTrame.push_back(char(dataSize & 0x7F) | 0x80);
        else
            wsTrame.push_back(char(dataSize & 0x7F));
    }
    else if(dataSize < 65535)
    {
        if(masked)
            wsTrame.push_back(char(126) | 0x80);
        else
            wsTrame.push_back(char(126));

        for(int i = 0; i < 16; i += 8)
            wsTrame.push_back(char(dataSize >> i));
    }
    else
    {
        if(masked)
            wsTrame.push_back(char(127) | 0x80);
        else
            wsTrame.push_back(char(127));

        for(int i = 0; i < 64; i+= 8)
            wsTrame.push_back(char(dataSize >> i));
    }

    if(masked)
    {
        unsigned char mask[4];
        char *maskedData = new char[dataSize];;
        for(int i = 0; i < 4; i++){
            mask[i] = std::rand() % 255;
            wsTrame.push_back(mask[i]);
        }
        for (size_t i = 0; i < dataSize; i++) {
            maskedData[i] ^= mask[i % 4];  // Apply masking
            wsTrame.push_back(maskedData[i]);
        }       
    }
    else
    {
        for(size_t i = 0; i < dataSize; i++)
            wsTrame.push_back(data[i]);
    }

    return wsTrame;
}

std::vector<char> encodeData(const char *data, size_t dataSize)
{
    return encodeData(data, dataSize, false);
}

std::vector<char> encodeData(std::string data, bool masked)
{
    return encodeData(data.c_str(), data.size(), masked);
}

std::vector<char> encodeData(std::string data)
{
    return encodeData(data, false);
}

DecodedData decodeData(int sockfd)
{
    DecodedData result;
    bool isLastTrame, isMasked;
    int payloadSize, dataType;
    char *payload;
    unsigned char *buffer;

    buffer = new unsigned char[2];
    recv(sockfd, (char*)buffer, 2, 0);
    isLastTrame = buffer[0] & 0x80;
    dataType = buffer[0] & 0x0F;
    isMasked = buffer[1] & 0x80;
    payloadSize = buffer[1] & 0x7F;
    delete [] buffer;

    if(payloadSize == 126)
    {
        buffer = new unsigned char[2];
        recv(sockfd, (char*)buffer, 2, 0);
        payloadSize = (buffer[0] << 8) | buffer[1];
        delete [] buffer;
    }
    else if(payloadSize == 127)
    {
        buffer = new unsigned char[8];
        recv(sockfd, (char*)buffer, 8, 0);
        payloadSize = 0;
        for(int i = 0; i < 8; i++)
            payloadSize |= buffer[i] << (64 - (i + 1) * 8);
        delete [] buffer;
    }

    payload = new char[payloadSize];
    payload[payloadSize] = '\0';

    if(isMasked)
    {
        buffer = new unsigned char[4];
        recv(sockfd, (char*)buffer, 4, 0);
        recv(sockfd, (char*)payload, payloadSize, 0);

        for (int i = 0; i < payloadSize; ++i) {
            payload[i] ^= buffer[i % 4];  // Apply masking
        }

        delete [] buffer;
    }
    else recv(sockfd, (char*)payload, payloadSize, 0);

    result.end = isLastTrame;
    result.dataType = dataType;
    if(dataType == OPCODE_BINARY)
        result.binaryData.assign(payload, payload + payloadSize);
    else
        result.textData = payload;

    delete [] payload;

    return result;
}

int sendEncodedMessage(std::string message, int client_socket, bool masked)
{
    std::vector<char> encodedMessage = encodeData(message, masked);
    return send(client_socket, encodedMessage.data(), encodedMessage.size(), 0);
}

int sendEncodedMessage(std::string message, int client_socket)
{
    return sendEncodedMessage(message, client_socket, true);
}