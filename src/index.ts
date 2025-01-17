import { Connection, PublicKey } from '@solana/web3.js';

const RAYDIUM_PUBLIC_KEY = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";//change if needed
const http_url = "http endpoint";
const wss_url = "wss endpoint";
const RAYDIUM = new PublicKey(RAYDIUM_PUBLIC_KEY);
const INSTRUCTION_NAME = "initialize2";

const connection = new Connection(http_url, {
    wsEndpoint: wss_url
});

async function fetchRaydiumMints(txId: string, connection: Connection) {
    try {
        const tx = await connection.getParsedTransaction(
            txId,
            {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed'
            });

        //@ts-ignore
        const accounts = (tx?.transaction.message.instructions).find(ix => ix.programId.toBase58() === RAYDIUM_PUBLIC_KEY).accounts as PublicKey[];
    
        if (!accounts) {
            console.log("No accounts found in the transaction.");
            return;
        }

        const tokenAIndex = 8;
        const tokenBIndex = 9;
        const poolIdIndex = 7;

        const tokenAAccount = accounts[tokenAIndex];
        const tokenBAccount = accounts[tokenBIndex];
        const poolIdAccount = accounts[poolIdIndex];

        // Assuming Pool ID can be derived from account data; adjust accordingly
        const poolId = poolIdAccount.toBase58(); // Example for demonstration

        const displayData = [
            { "Token": "A", "Account Public Key": tokenAAccount.toBase58() },
            { "Token": "B", "Account Public Key": tokenBAccount.toBase58() },
            { "Pool ID": poolId }
        ];

        console.log("New LP Found");
        console.table(displayData);
    
    } catch {
        console.log("Error fetching transaction:", txId);
        return;
    }
}

async function startConnection(connection: Connection, programAddress: PublicKey, searchInstruction: string): Promise<void> {
    console.log("Monitoring logs for program:", programAddress.toString());
    connection.onLogs(
        programAddress,
        ({ logs, err, signature }) => {
            if (err) return;

            if (logs && logs.some(log => log.includes(searchInstruction))) {
                fetchRaydiumMints(signature, connection);
            }
        },
        "finalized"
    );
}

startConnection(connection, RAYDIUM, INSTRUCTION_NAME).catch(console.error);