#!/bin/bash

FILE="history.txt"

# colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

USER_SELECTED=""

while true
do
    clear
    echo -e "${YELLOW}---- ADMIN PANEL (history.txt) ----${NC}"
    echo "1. Select user"
    echo "2. View recent games"
    echo "3. Analytics"
    echo "4. Delete entries"
    echo "5. Log rotation"
    echo "6. Sort and view"
    echo "7. Exit"
    echo ""

    read -p "Enter choice: " choice

    # 1. select user (with validation)
    if [ "$choice" = "1" ]; then
        echo "Users available:"
        cut -d',' -f1 "$FILE" | sort | uniq
        echo ""

        read -p "Enter username: " temp_user

        if grep -q "^$temp_user," "$FILE"; then
            USER_SELECTED="$temp_user"
            echo -e "${GREEN}Now working with: $USER_SELECTED${NC}"
        else
            echo -e "${RED}User not found!${NC}"
            USER_SELECTED=""
        fi

        read -p "Press enter..."

    # 2. view recent games
    elif [ "$choice" = "2" ]; then
        if [ -z "$USER_SELECTED" ]; then
            echo -e "${RED}No user selected${NC}"
        else
            echo "Showing last games for $USER_SELECTED"
            echo ""

            grep "^$USER_SELECTED," "$FILE" | tail -n 20 | while IFS=',' read u sc cause dur ts
            do
                if [ "$cause" = "wall" ]; then
                    cause_col="${BLUE}$cause${NC}"
                elif [ "$cause" = "self" ]; then
                    cause_col="${RED}$cause${NC}"
                else
                    cause_col="${GREEN}$cause${NC}"
                fi

                echo -e "$u | $sc | $cause_col | $dur | $ts"
            done | less -R
        fi
        read -p "Press enter..."

    # 3. analytics
    elif [ "$choice" = "3" ]; then
        read -p "Enter timestamp limit (or press enter): " TS

        if [ -z "$TS" ]; then
            DATA=$(cat "$FILE")
        else
            DATA=$(awk -F',' -v t="$TS" '$5 <= t' "$FILE")
        fi

        echo ""
        echo "Basic stats:"

        echo "$DATA" | awk -F',' '
        BEGIN {s=0; d=0; c=0; w=0; se=0; en=0}
        {
            s+=$2; d+=$4; c++
            if($3=="wall") w++
            else if($3=="self") se++
            else if($3=="enemy") en++
        }
        END{
            if(c==0){print "No data found"; exit}
            print "Avg score:", s/c
            print "Avg duration:", d/c
            print "Wall deaths:", w/c
            print "Self deaths:", se/c
            print "Enemy deaths:", en/c
        }'

        read -p "Press enter..."

    # 4. delete entries
    elif [ "$choice" = "4" ]; then
        echo "Delete options:"
        echo "1. By username"
        echo "2. By timestamp"
        echo "3. Remove bad lines"
        read -p "Choice: " ch

        if [ "$ch" = "1" ]; then
            read -p "Enter username: " u
            read -p "Are you sure? (y/n): " c
            if [ "$c" = "y" ]; then
                grep -v "^$u," "$FILE" > tmp && mv tmp "$FILE"
                echo "Done"
            fi

        elif [ "$ch" = "2" ]; then
            read -p "Enter timestamp: " t
            read -p "Are you sure? (y/n): " c
            if [ "$c" = "y" ]; then
                awk -F',' -v x="$t" '$5!=x' "$FILE" > tmp && mv tmp "$FILE"
                echo "Done"
            fi

        elif [ "$ch" = "3" ]; then
            awk -F',' 'NF==5' "$FILE" > tmp && mv tmp "$FILE"
            echo "Cleaned invalid lines"
        fi

        read -p "Press enter..."

    # 5. log rotation
    elif [ "$choice" = "5" ]; then
        cp "$FILE" "backup_$(date +%s).txt"
        tail -n 10 "$FILE" > tmp && mv tmp "$FILE"
        echo "Backup made and file trimmed"
        read -p "Press enter..."

    # 6. sorting
    elif [ "$choice" = "6" ]; then
        echo "Sort by:"
        echo "1. Timestamp"
        echo "2. Username"
        echo "3. Score"
        read -p "Choice: " ch

        if [ "$ch" = "2" ]; then
            sort -t',' -k1 "$FILE" | less
        elif [ "$ch" = "3" ]; then
            sort -t',' -k2 -n "$FILE" | less
        else
            sort -t',' -k5 -n "$FILE" | less
        fi

    # 7. exit
    elif [ "$choice" = "7" ]; then
        exit 0

    else
        echo "Invalid choice"
        read -p "Press enter..."
    fi
done
