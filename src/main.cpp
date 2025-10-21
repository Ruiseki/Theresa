#include "server.hpp"

int main()
{
    // init_save_folder();
    init_sockets();

    while(true) listener();

    return 0;
}
