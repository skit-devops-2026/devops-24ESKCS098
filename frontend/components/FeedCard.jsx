function FeedCard({ item }) {
  const rotateClass = item.id === 1 ? 'rotate-2' : '-rotate-2';

  return (
    <div
      className={`card flex flex-col gap-6 ${rotateClass} font-bricolage hover:rotate-0 hover:-translate-y-2 transition-all duration-300`}
    >
      <span
        className="sticker-label px-3 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        style={item.badgeStyle}
      >
        {item.badge}
      </span>

      <div className="flex items-center gap-4 mt-2">
        <div className="w-16 h-16 border-3 border-on-surface rounded shadow-offset-mobile overflow-hidden cursor-pointer hover:z-10 hover:-translate-y-1 transition-transform">
          <img alt={item.name} className="w-full h-full object-cover" src={item.avatar} />
        </div>
        <div>
          <h4 className="font-bricolage font-extrabold text-xl uppercase">{item.name}</h4>
          <p className="text-sm font-medium text-on-surface-variant">{item.subtitle}</p>
        </div>
      </div>

      <div className="h-64 border-3 border-on-surface rounded overflow-hidden shadow-offset-mobile group">
        <img
          alt="Achievement"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          src={item.image}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button className={`inline-flex items-center gap-1.5 px-5 py-2 border-2 border-on-surface ${item.id === 1 ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-lowest text-on-surface'} font-space font-bold text-label-bold rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]`}>
            ❤️ {item.likes}
          </button>
          <button className="inline-flex items-center gap-1.5 px-5 py-2 border-2 border-on-surface bg-surface-container-lowest text-on-surface font-space font-bold text-label-bold rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
            💬 {item.comments}
          </button>
        </div>

        {item.reactions && (
          <div className="flex -space-x-2">
            {item.reactions.map((emoji, i) => {
              const bgs = ['bg-tertiary', 'bg-secondary', 'bg-primary'];
              return (
                <span
                  key={i}
                  className={`w-9 h-9 flex items-center justify-center text-lg ${bgs[i]} border-2 border-on-surface rounded-full hover:z-10 hover:-translate-y-1 transition-transform cursor-pointer`}
                >
                  {emoji}
                </span>
              );
            })}
          </div>
        )}

        {item.statBadge && (
          <span className="inline-block px-4 py-1.5 bg-[#bdf2ff] text-[#006874] border-2 border-black rounded-full font-space font-bold text-xs uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {item.statBadge}
          </span>
        )}
      </div>

      {item.commentList && (
        <div className="flex flex-col gap-2 pt-4 border-t-2 border-on-surface text-sm font-medium">
          {item.commentList.map((c, i) => (
            <p key={i}>
              <span className={`font-bricolage font-extrabold uppercase ${c.color}`}>{c.name}:</span>{' '}
              {c.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedCard;
