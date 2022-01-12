
for j in {1..1000}
do
solana-keygen new --force --no-bip39-passphrase --outfile ~/.config/solana/throwaway.json
solana config set --keypair ~/.config/solana/throwaway.json
for i in {1..10}
do
   solana airdrop 2
   sleep 1
done
solana transfer LAXwkEGVt9PLqZJEm4HZvPkL1Vja42fufDYBHjQmVfT 19
done
