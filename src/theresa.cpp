#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

#include "server.hpp"

int main()
{
    init_server_data();
    while(true)
    {
        listener();
    }
    return 0;
}
