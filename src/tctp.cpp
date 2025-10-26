#include <cstring>
#include <sys/socket.h>

#include "tctp.hpp"

using namespace tctp;

int send_data(int socket, T_MAIN_COMMAND main_command, T_SUB_COMMAND sub_command, T_PAYLOAD payload = nullptr, T_PAYLOAD_LENGTH payload_len = 0)
{
    int sended_size = 0;
    unsigned char main_frame[MIN_FRAME_SIZE];
    memset(main_frame, 0, MIN_FRAME_SIZE);

    memcpy(main_frame + MAIN_COMMAND_POS, &main_command, MAIN_COMMAND_SIZE);
    memcpy(main_frame + SUB_COMMAND_POS, &sub_command, SUB_COMMAND_SIZE);

    int saved_payload_length = payload_len < BIG_PAYLOAD_LENGTH_MASK ? payload_len : BIG_PAYLOAD_LENGTH_MASK;

    return 0;
}

int recv_data(int socket, T_MAIN_COMMAND *main_command, T_SUB_COMMAND *sub_command, T_PAYLOAD *payload, T_PAYLOAD_LENGTH *payload_len)
{
    int recved_size = 0;
    T_PAYLOAD_LENGTH saved_payload_length = 0;
    T_PAYLOAD saved_payload = nullptr;

    auto exit_error = [&](int error_code) -> int
    {
        main_command = nullptr;
        sub_command = nullptr;
        payload = nullptr;
        payload_len = nullptr;
        return error_code;
    };

    // Use recv() to store n byte to input
    auto recv_frame_info = [&]<typename T>(T* input, long n) -> int
    {
        T* temp = new T;
        int recv_result = recv(socket, temp, n, 0);

        if(recv_result < 0)
        {
            delete temp;
            return exit_error(recv_result);
        }

        recved_size += recv_result;
        if(input)
            *input = *temp;
        delete temp;

        return recv_result;
    };

    // get a basic frame information
    int result = 0;

    result = recv_frame_info(main_command, MAIN_COMMAND_SIZE);
    if(result < 0)
        return result;

    result = recv_frame_info(sub_command, SUB_COMMAND_SIZE);
    if(result < 0)
        return result;

    result = recv_frame_info(&saved_payload_length, PAYLOAD_LENGTH_SIZE);
    if(result < 0)
        return result;
    if(saved_payload_length & BIG_PAYLOAD_LENGTH_MASK)
    {
        result = recv_frame_info(&saved_payload_length, BIG_PAYLOAD_LENGTH_MASK);
        if(result < 0)
            return result;
    }
    if(payload_len)
        *payload_len = saved_payload_length;
    // -----------------------------

    // get the payload
    saved_payload = new unsigned char[saved_payload_length];
    if(payload)
        *payload = saved_payload;

    T_PAYLOAD_LENGTH bytes_rcvd = 0;
    while(bytes_rcvd < saved_payload_length)
    {
        // To do :
        // Need to send a "next" frame info to the sender in order to start the download.
        // So, we need to code how to send a frame
    }
    // ---------------

    return recved_size;
}
