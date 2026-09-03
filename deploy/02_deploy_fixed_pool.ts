import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const tokenAddress = "0xE560dBc970bB0347ABD1582A20a0f65C35795171";

  console.log("Deploying fixed ConfidentialPrizePool...");
  console.log(`Using existing token: ${tokenAddress}`);

  const poolDeployment = await deploy("ConfidentialPrizePoolFixed", {
    from: deployer,
    contract: "ConfidentialPrizePool",
    args: [tokenAddress],
    log: true,
  });

  console.log(
    `ConfidentialPrizePool deployed at: ${poolDeployment.address}`
  );
};

export default func;

func.id = "deploy_fixed_pool";
func.tags = ["FixedPool"];
