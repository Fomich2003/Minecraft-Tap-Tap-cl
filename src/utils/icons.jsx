const CoinIcon = () => (
    <svg className="mc-coin" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
        <path fill="#6b3f00" d="M4 0h4v1h2v1h1v2h1v4h-1v2h-1v1H8v1H4v-1H2v-1H1V8H0V4h1V2h1V1h2z" />
        <path fill="#ffc933" d="M4 1h4v1h2v2h1v4h-1v2H8v1H4v-1H2V8H1V4h1V2h2z" />
        <path fill="#ffe98a" d="M4 2h4v1H4zM3 3h1v1H3zM2 4h1v3H2z" />
        <path fill="#d98e04" d="M5 4h2v4H5zM9 5h1v3H9zM8 8h1v1H8zM5 9h3v1H5z" />
    </svg>
)

const GlobeIcon = () => (
    <svg className="mc-globe" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
        <path fill="#1f5fbf" d="M4 0h4v1h2v1h1v2h1v4h-1v2h-1v1H8v1H4v-1H2v-1H1V8H0V4h1V2h1V1h2z" />
        <path fill="#6cc349" d="M3 1h3v1h1v2H6v1H4v2H3V6H2V5H1V4h1V2h1zM8 5h3v3h-1v2H8V8H7V6h1zM4 9h2v2H4z" />
    </svg>
)

const Logo = ({ size = 96 }) => (
    <img className="Logo" src={size > 96 ? "/assets/logo-320.png" : "/assets/logo-96.png"} width={size} height={size} alt="Minecraft Tap-Tap" draggable={false} />
)

export { CoinIcon, GlobeIcon, Logo }
