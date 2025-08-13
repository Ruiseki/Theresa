#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

#include "common.hpp"
#include "server.hpp"

int main()
{
    
    // init_save_folder();
    init_sockets();

    while(true) listener();

    return 0;
}
