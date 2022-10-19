import { FundMe } from "./../typechain-types/contracts/FundMe"
import { ethers, getNamedAccounts } from "hardhat"
async function main() {
  const { deployer } = await getNamedAccounts()
  const fundMe = await ethers.getContract<FundMe>("FundMe", deployer)

  console.log("Funding...")

  const txResponse = await fundMe.withdraw()
  txResponse.wait(1)

  console.log("Got it back!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
