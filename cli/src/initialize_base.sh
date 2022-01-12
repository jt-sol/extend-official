while getopts v:k:e: flag
do
    case "${flag}" in
        k) KEYPAIR=${OPTARG};;
        v) VANITY=${OPTARG};;
        e) ENV=${OPTARG};;
    esac
done

npx ts-node extend-cli.ts initialize-base -k ${KEYPAIR} -v ${VANITY} -e ${ENV}