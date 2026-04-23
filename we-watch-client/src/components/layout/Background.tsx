const Background = () => {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.6,
        }}
      />

      <div className="pointer-events-none fixed inset-0 z-[-20] bg-gradient-to-b from-[#0A0A0B]/80 via-[#0A0A0B]/40 to-[#0A0A0B]" />

      <div className="pointer-events-none absolute top-[-10%] left-1/4 z-0 h-[600px] w-[600px] rounded-full bg-[#C800DF]/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-[-10%] z-0 h-[600px] w-[600px] rounded-full bg-[#E60076]/10 blur-[120px]" />
    </>
  );
};

export default Background;
