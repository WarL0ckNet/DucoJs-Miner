# DucoJs-Miner
A Multi-Threaded Node.JS Miner for [DuinoCoin](https://duinocoin.com/)

## Get started

```bash
git clone https://github.com/WarL0ckNet/DucoJs-Miner.git
cd DucoJs-Miner
npm install
npm run mine -- -u Username -t 4 -d LOW
```

### Options

```bash
  -h, --help                Display this help                                                      
  -v, --version             Show miner version                                                     
  -u, --user string         Wallet username                                                        
  -t, --threads number      Threads count. Default CPU count                                       
  -d, --difficulty string   Mining difficulty. Value may be LOW,MEDIUM,NET,EXTREME. Default MEDIUM 
  -m, --miner string        Miner identifier. Default None
```