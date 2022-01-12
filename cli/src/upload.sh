set -e

while getopts k:x:y:e: flag
do
    case "${flag}" in
        k) KEYPAIR=${OPTARG};;
        x) NX=${OPTARG};;
        y) NY=${OPTARG};;
        e) ENV=${OPTARG};;
    esac
done

echo $KEYPAIR
npx ts-node extend-cli.ts upload-neighborhood -k ${KEYPAIR} -l trace -nx ${NX} -ny ${NY} -e ${ENV}
