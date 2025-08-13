// This is the header for the Theresa Command Transmition Protocol
#ifndef TCTP_HPP_INCLUDED
#define TCTP_HPP_INCLUDED

#include <cstdint>

namespace tctp
{
    typedef uint8_t T_MAIN_COMMAND;
    typedef uint8_t T_SUB_COMMAND;
    typedef uint32_t T_PAYLOAD_LENGTH;
    typedef unsigned char* T_PAYLOAD;

    #define MIN_FRAME_SIZE 8 + 8 + 32
    #define MAIN_COMMAND_SIZE 8 / sizeof(char)
    #define SUB_COMMAND_SIZE 8 / sizeof(char)
    #define PAYLOAD_LENGTH_SIZE 32 / sizeof(char)
    #define MAIN_COMMAND_POS 0
    #define SUB_COMMAND_POS MAIN_COMMAND_POS + MAIN_COMMAND_SIZE
    #define PAYLOAD_LENGTH_POS SUB_COMMAND_POS + SUB_COMMAND_SIZE
    #define PAYLOAD_POS PAYLOAD_LENGTH_POS + PAYLOAD_LENGTH_SIZE

    #define PAYLOAD_FRAGMENTED_MASK 0x80000000
    #define BUFFER_SIZE 0x200

    int send_data(int socket, T_MAIN_COMMAND main_command, T_SUB_COMMAND sub_command, T_PAYLOAD payload = nullptr, T_PAYLOAD_LENGTH payload_len = 0);
    int recv_data(int socket, T_MAIN_COMMAND *main_command, T_SUB_COMMAND *sub_command, T_PAYLOAD *payload, T_PAYLOAD_LENGTH *payload_len);
}

#endif
