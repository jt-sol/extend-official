while getopts k:a: flag
do
    case "${flag}" in
        k) KEYPAIR=${OPTARG};;
        a) AUTH=${OPTARG};;
    esac
done

npx ts-node extend-cli.ts update-authority -k ${KEYPAIR} -a ${AUTH}
