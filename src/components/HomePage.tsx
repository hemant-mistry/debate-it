function HomePage() {
  return (
    <>
      <div>
        <div className="card flex items-center bg-black shadow-xl p-4">
          <div className="flex-row card-body">
            <button className="btn btn-secondary btn-sm">Create Room</button>
            <button className="btn btn-ghost btn-sm">Join Room</button>
          </div>
          <div className="flex flex-col gap-4">
            <div className="label">
              <span className="label-text">Enter your name:</span>
            </div>
            <input
              type="text"
              placeholder="Type here"
              className="input input-bordered input-sm w-full"
            />
            <div className="label">
              <span className="label-text">Select topic:</span>
            </div>
            <input
              type="text"
              placeholder="Type here"
              className="input input-bordered input-sm w-full"
            />
            <div className="flex justify-center mt-4">
              <button className="btn btn-secondary btn-sm">Create Room</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
