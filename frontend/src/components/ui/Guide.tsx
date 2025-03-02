import AboutIcon from "../../assets/about-icon.png";
import WhatsNew from "../../assets/new-icon.png";
import Instruction from "../../assets/instruction-icon.png";

function Guide() {
  return (
    <>
      <div className="guide-container flex items-center justify-center">
        <div className="guide-box flex flex-col md:flex-row justify-between p-10 w-[100rem] items-center">
          <div className="space-one p-4">
            <div className="header-container flex flex-row items-center justify-center">
              <div className="space-one-image pr-4">
                <img src={AboutIcon} />
              </div>
              <div className="space-one-header text-2xl text-center">About</div>
            </div>

            <div className="space-one-desc text-center mt-2 text-sm">
              Debate-It is an interactive debate game that lets you create or
              join rooms with a unique room code, sign in via Google, and
              immediately start debating AI-generated topics. Each player takes
              turns presenting their arguments, and once everyone has had their
              say, the AI judges the debate and awards scores.
            </div>
          </div>
          <div className="space-two p-4">
            <div className="header-container  flex flex-row items-center justify-center">
              <div className="space-one-image pr-4">
                <img src={WhatsNew} />
              </div>
              <div className="space-two-header text-2xl text-center">
                What's new?
              </div>
            </div>
            <div className="space-two-desc text-center mt-2 text-sm">
              Our latest update introduces refined AI scoring for more accurate
              judging, a smoother room creation and joining process, and the
              ability to provide your own topic that the AI will enhance for an
              engaging debate. We’ve also improved the overall user experience
              to make setting up and participating in debates quick and
              effortless.{" "}
            </div>
          </div>
          <div className="space-three p-4">
            <div className="header-container  flex flex-row items-center justify-center">
              <div className="space-one-image pr-4">
                <img src={Instruction} />
              </div>
              <div className="space-two-header text-2xl text-center">
                Instructions
              </div>
            </div>
            <div className="space-three-desc text-center mt-2  text-sm">
              To begin, sign in with Google and either create or join a room
              using a room code. Enter a topic you’d like to debate, and the AI
              will generate the discussion prompt. Each player gets a set number
              of turns—after all turns are used, the AI scores the debate based
              on clarity, coherence, and persuasiveness. The highest-scoring
              player is declared the winner!
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Guide;
