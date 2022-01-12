set -e

while getopts x:y:c: flag
do
    case "${flag}" in
        x) NX=${OPTARG};;
        y) NY=${OPTARG};;
    esac
done

npx ts-node extend-cli.ts fund-hot-wallet -l trace -nx ${NX} -ny ${NY}
npx ts-node extend-cli.ts upload-neighborhood -l trace -nx ${NX} -ny ${NY}

