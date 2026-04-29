#!/bin/bash

FILE="history.txt"

# colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

USER_SELECTED=""

# check file
if [ ! -f "$FILE" ]; then
    echo "history.txt not found!"
    exit 1
fi

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

    if [ "$choice" = "1" ]; then
        echo "Users available:"
        awk -F',' '{print $1}' "$FILE" | sort | uniq
        echo ""

        read -p "Enter username: " temp_user

        if awk -F',' -v u="$temp_user" '$1==u{found=1} END{exit !found}' "$FILE"; then
            USER_SELECTED="$temp_user"
            echo -e "${GREEN}Now working with: $USER_SELECTED${NC}"
        else
            echo -e "${RED}User not found!${NC}"
            USER_SELECTED=""
        fi

        read -p "Press enter..."

    elif [ "$choice" = "2" ]; then
        if [ -z "$USER_SELECTED" ]; then
            echo -e "${RED}No user selected${NC}"
        else
            echo "Showing last games for $USER_SELECTED"
            echo ""

            awk -F',' -v u="$USER_SELECTED" '$1==u' "$FILE" | tail -n 20 | \
            while IFS=',' read u sc cause dur ts
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

    elif [ "$choice" = "3" ]; then
        read -p "Enter timestamp limit (or press enter): " TS

        echo ""
        echo "Basic stats:"

        if [ -z "$TS" ]; then
            awk -F',' '
            BEGIN {s=0; d=0; c=0; w=0; se=0; en=0}
            NF==5 {
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
            }' "$FILE"
        else
            awk -F',' -v t="$TS" '
            BEGIN {s=0; d=0; c=0; w=0; se=0; en=0}
            NF==5 && $5 <= t {
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
            }' "$FILE"
        fi

        read -p "Press enter..."

    elif [ "$choice" = "4" ]; then
        echo "Delete options:"
        echo "1. By username"
        echo "2. By timestamp"
        echo "3. Remove bad lines"
        read -p "Choice: " ch

        TMP_FILE=$(mktemp)

        if [ "$ch" = "1" ]; then
            read -p "Enter username: " u
            read -p "Are you sure? (y/n): " c
            if [ "$c" = "y" ]; then
                awk -F',' -v user="$u" '$1!=user' "$FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$FILE"
                echo "Done"
            fi

        elif [ "$ch" = "2" ]; then
            read -p "Enter timestamp: " t
            read -p "Are you sure? (y/n): " c
            if [ "$c" = "y" ]; then
                awk -F',' -v x="$t" '$5!=x' "$FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$FILE"
                echo "Done"
            fi

        elif [ "$ch" = "3" ]; then
            awk -F',' 'NF==5' "$FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$FILE"
            echo "Cleaned invalid lines"

        else
            echo "Invalid option"
        fi

        read -p "Press enter..."

    elif [ "$choice" = "5" ]; then
        echo "Log rotation menu:"
        echo "1. Rotate logs"
        echo "2. Restore from backup"
        read -p "Choice: " sub

        if [ "$sub" = "1" ]; then
            BACKUP="backup_$(date +%Y-%m-%d_%H-%M-%S).tar.gz"

            tar -czf "$BACKUP" "$FILE"

            TMP_FILE=$(mktemp)

            awk '{
                lines[NR]=$0
            }
            END{
                start = (NR > 10) ? NR-9 : 1
                for(i=start;i<=NR;i++) print lines[i]
            }' "$FILE" > "$TMP_FILE"

            mv "$TMP_FILE" "$FILE"

            echo "Backup created: $BACKUP"
            echo "Trimmed to last 10 entries"

            COUNT=$(ls backup_*.tar.gz 2>/dev/null | wc -l)
            if [ "$COUNT" -gt 5 ]; then
                ls -t backup_*.tar.gz | awk 'NR>5' | while read old
                do
                    rm -f "$old"
                done
                echo "Old backups cleaned"
            fi

        elif [ "$sub" = "2" ]; then
            echo "Available backups:"
            ls backup_*.tar.gz 2>/dev/null || echo "No backups found"

            read -p "Enter backup file name: " bfile

            if [ -f "$bfile" ]; then
                read -p "Overwrite current history? (y/n): " c

                if [ "$c" = "y" ]; then
                    tar -xzf "$bfile"
                    echo "Restored from $bfile"
                else
                    echo "Cancelled"
                fi
            else
                echo "Backup not found"
            fi

        else
            echo "Invalid option"
        fi

        read -p "Press enter..."

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
            sort -t',' -k5 -n "$FILE" | less
        else
            echo "Invalid option"
        fi

        read -p "Press enter..."

    elif [ "$choice" = "7" ]; then
        exit 0

    else
        echo "Invalid choice"
        read -p "Press enter..."
    fi
done