import AboutIcon from "../../assets/about-icon.png";
import WhatsNew from "../../assets/new-icon.png";
import Instruction from "../../assets/instruction-icon.png";

function Guide() {
    return (
        <>
            <div className="guide-container flex items-center justify-center">
                <div className="guide-box flex flex-col md:flex-row justify-between mt-10 p-10 w-[100rem] items-center">
                    <div className="space-one p-4">
                        <div className="header-container flex flex-row items-center justify-center">
                            <div className="space-one-image pr-4">
                                <img src={AboutIcon} />
                            </div>
                            <div className="space-one-header text-3xl text-center">
                                About
                            </div>
                        </div>

                        <div className="space-one-desc text-center mt-2">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Non repellendus eligendi provident doloribus voluptate sint esse quibusdam ullam maiores, necessitatibus quod iste dolorum molestias libero tempora harum? Delectus, molestias officiis.
                        </div>
                    </div>
                    <div className="space-two p-4">
                        <div className="header-container  flex flex-row items-center justify-center">
                            <div className="space-one-image pr-4">
                                <img src={WhatsNew} />
                            </div>
                            <div className="space-two-header text-3xl text-center">
                                What's new?
                            </div>
                        </div>
                        <div className="space-two-desc text-center mt-2">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Non repellendus eligendi provident doloribus voluptate sint esse quibusdam ullam maiores, necessitatibus quod iste dolorum molestias libero tempora harum? Delectus, molestias officiis.
                        </div>
                    </div>
                    <div className="space-three p-4">
                    <div className="header-container  flex flex-row items-center justify-center">
                            <div className="space-one-image pr-4">
                                <img src={Instruction} />
                            </div>
                            <div className="space-two-header text-3xl text-center">
                                Instructions
                            </div>
                        </div>
                        <div className="space-three-desc text-center mt-2">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Non repellendus eligendi provident doloribus voluptate sint esse quibusdam ullam maiores, necessitatibus quod iste dolorum molestias libero tempora harum? Delectus, molestias officiis.
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}
export default Guide;