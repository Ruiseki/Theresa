#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

#include "common.hpp"
#include "server.hpp"

int main(int argc, char **argv)
{
    char *save_folder_path = argc >= 1 ? argv[0] : nullptr;

    init_save_folder(save_folder_path);
    init_sockets();

    while(true) listener();

    return 0;
}
