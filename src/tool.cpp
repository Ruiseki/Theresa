#include "tool.hpp"

std::vector<std::string> split(std::string str, char c)
{
    std::vector<std::string> split;
    std::string buffer = "";

    for(size_t i = 0; i < str.size(); i++)
    {
        if(str[i] == c && buffer != "")
        {
            split.push_back(buffer);
            buffer = "";
        }
        else buffer += str[i];
    }
    if(buffer != "") split.push_back(buffer);

    return split;
}
