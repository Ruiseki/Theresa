// This is the header for the Theresa Command Transmition Protocol
#ifndef TCTP_HPP_INCLUDED
#define TCTP_HPP_INCLUDED

#include <cstdint>

/*
 *
 * Basic data frame
 * 1 bytes -> Main command
 * 1 bytes -> Sub command
 * 4 bytes -> payload length
 *
 * Payload length will use 31 bits to store the payload length.
 * If the MSB is 1, then read the next 8 bytes to get the payload length
 *
 * The payload start in the next frame. If the size of the payload is greater than BUFFER_SIZE,
 *  the payload will be fragmented in multiple frame. Such a frame is structured like so :
 *  1 bytes -> Main command
 *  1 bytes -> Sub command
 *  2 bytes -> payload length (can't be greater than BUFFER_SIZE)
 *  X bytes -> payload / payload fragment
 *
 */

namespace tctp
{
    typedef uint8_t T_MAIN_COMMAND;
    typedef uint8_t T_SUB_COMMAND;
    typedef unsigned long long T_PAYLOAD_LENGTH;
    typedef unsigned char* T_PAYLOAD;

    // Defined used to cut the frame
    #define MAIN_COMMAND_SIZE sizeof(T_MAIN_COMMAND)
    #define SUB_COMMAND_SIZE sizeof(T_SUB_COMMAND)
    #define PAYLOAD_LENGTH_SIZE sizeof(T_PAYLOAD)
    #define MIN_FRAME_SIZE MAIN_COMMAND_SIZE + SUB_COMMAND_SIZE + PAYLOAD_LENGTH_SIZE
    #define BIG_PAYLOAD_LENGTH_SIZE 8

    #define MAIN_COMMAND_POS 0
    #define SUB_COMMAND_POS MAIN_COMMAND_POS + MAIN_COMMAND_SIZE
    #define PAYLOAD_LENGTH_POS SUB_COMMAND_POS + SUB_COMMAND_SIZE
    #define PAYLOAD_POS PAYLOAD_LENGTH_POS + PAYLOAD_LENGTH_SIZE

    // Mask and buffer size
    #define BIG_PAYLOAD_LENGTH_MASK 0x80000000
    #define BUFFER_SIZE 0x200

    int send_data(int socket, T_MAIN_COMMAND main_command, T_SUB_COMMAND sub_command, T_PAYLOAD payload = nullptr, T_PAYLOAD_LENGTH payload_len = 0);
    int recv_data(int socket, T_MAIN_COMMAND *main_command, T_SUB_COMMAND *sub_command, T_PAYLOAD *payload, T_PAYLOAD_LENGTH *payload_len);
}

#endif // TCTP_HPP_INCLUDED
