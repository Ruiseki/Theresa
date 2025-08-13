#include <sys/socket.h>

#include "tctp.hpp"

using namespace tctp;

int recv_data(int socket, T_MAIN_COMMAND *main_command, T_SUB_COMMAND *sub_command, T_PAYLOAD *payload, T_PAYLOAD_LENGTH *payload_len)
{
    int recvd_size = 0;
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

    auto recv_frame_info = [&]<typename T>(T* v, long n) -> int
    {
        T* temp = new T;
        int recv_result = recv(socket, temp, n, 0);

        if(recv_result < 0)
        {
            delete temp;
            return exit_error(recv_result);
        }

        recvd_size += recv_result;
        if(v)
            *v = *temp;
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
    if(payload_len)
        *payload_len = saved_payload_length;

    // -----------------------------

    // get the payload
    saved_payload = new unsigned char[saved_payload_length];
    if(payload)
        *payload = saved_payload;

    T_PAYLOAD_LENGTH bytes_rcvd = 0;
    // ---------------

    return recvd_size;
}
