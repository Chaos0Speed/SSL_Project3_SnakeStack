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

    # 1. select user
    if [ "$choice" = "1" ]; then
        echo "Users available:"
        cut -d',' -f1 "$FILE" | sort | uniq
        echo ""

        read -p "Enter username: " temp_user

        if awk -F',' -v u="$temp_user" 'tolower($1)==tolower(u){found=1} END{exit !found}' "$FILE"; then
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

            awk -F',' -v u="$USER_SELECTED" 'tolower($1)==tolower(u)' "$FILE" | tail -n 20 |
            while IFS=',' read u sc cause dur ts
            do
                cause_lc=$(echo "$cause" | tr 'A-Z' 'a-z')

                if [ "$cause_lc" = "wall" ]; then
                    cause_col="${BLUE}$cause${NC}"
                elif [ "$cause_lc" = "self" ]; then
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
        read -p "Enter timestamp limit (DD-MM-YYYY HH:MM:SS or press enter): " TS

        echo ""
        echo "------ Analytics ------"

        awk -F',' -v limit="$TS" '
        BEGIN {
            s=0; d=0; c=0
            w=0; se=0; en=0

            if(limit != "") {
                lim = substr(limit,7,4) substr(limit,4,2) substr(limit,1,2) \
                      substr(limit,12,2) substr(limit,15,2) substr(limit,18,2)
            }
        }

        NF==5 {
            cur = substr($5,7,4) substr($5,4,2) substr($5,1,2) \
                  substr($5,12,2) substr($5,15,2) substr($5,18,2)

            if(limit == "" || cur <= lim) {
                s += $2
                d += $4
                c++

                cause = tolower($3)

                if(cause=="wall") w++
                else if(cause=="self") se++
                else if(cause=="enemy") en++
            }
        }

        END {
            if(c==0){
                print "No data found"
                exit
            }

            print "Total games:", c
            print "Mean score:", s/c
            print "Mean duration:", d/c

            print "Fraction wall deaths:", w/c
            print "Fraction self deaths:", se/c
            print "Fraction enemy deaths:", en/c
        }' "$FILE"

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
                awk -F',' -v user="$u" 'tolower($1)!=tolower(user)' "$FILE" > tmp && mv -f tmp "$FILE"
                echo "Done"
            fi

        elif [ "$ch" = "2" ]; then
            read -p "Enter timestamp: " t
            read -p "Are you sure? (y/n): " c
            if [ "$c" = "y" ]; then
                awk -F',' -v x="$t" '$5!=x' "$FILE" > tmp && mv -f tmp "$FILE"
                echo "Done"
            fi

        elif [ "$ch" = "3" ]; then
            awk -F',' 'NF==5' "$FILE" > tmp && mv -f tmp "$FILE"
            echo "Cleaned invalid lines"
        fi

        read -p "Press enter..."

    # 5. log rotation
    elif [ "$choice" = "5" ]; then
        BACKUP="backup_$(date +%s).tar.gz"

        tar -czf "$BACKUP" "$FILE" 2>/dev/null

        if [ $? -ne 0 ]; then
            echo "Permission denied! Run in writable directory or use sudo."
            read -p "Press enter..."
            continue
        fi

        TMP=$(mktemp)
        tail -n 10 "$FILE" > "$TMP"
        mv -f "$TMP" "$FILE"

        echo "Backup created: $BACKUP"
        echo "File trimmed to last 10 entries"

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

        elif [ "$ch" = "1" ]; then
            awk -F',' 'NF==5 {
                ts = substr($5,7,4) substr($5,4,2) substr($5,1,2) \
                     substr($5,12,2) substr($5,15,2) substr($5,18,2)
                print ts "," $0
            }' "$FILE" | sort -t',' -k1 | cut -d',' -f2- | less

        else
            echo "Invalid option"
            read -p "Press enter..."
        fi

    # 7. exit
    elif [ "$choice" = "7" ]; then
        exit 0

    else
        echo "Invalid choice"
        read -p "Press enter..."
    fi
done