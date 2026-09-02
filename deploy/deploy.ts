import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying ConfidentialTestToken...");
  const tokenDeployment = await deploy("ConfidentialTestToken", {
    from: deployer,
    log: true,
  });
  console.log(`ConfidentialTestToken deployed at: ${tokenDeployment.address}`);

  console.log("Deploying ConfidentialPrizePool...");
  const poolDeployment = await deploy("ConfidentialPrizePool", {
    from: deployer,
    args: [tokenDeployment.address],
    log: true,
  });
  console.log(`ConfidentialPrizePool deployed at: ${poolDeployment.address}`);

  console.log("Deploying MockYieldSource...");
  const yieldDeployment = await deploy("MockYieldSource", {
    from: deployer,
    args: [tokenDeployment.address],
    log: true,
  });
  console.log(`MockYieldSource deployed at: ${yieldDeployment.address}`);
};

export default func;
func.id = "deploy_secretpool";
func.tags = ["SecretPool"];
