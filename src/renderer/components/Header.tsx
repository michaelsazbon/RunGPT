import { Link } from 'react-router-dom';
import icon from '../../../assets/icon.png';

declare const APP_VERSION: string;

export default function Header() {

    const version = APP_VERSION;

    return (
        <nav className="navbar navbar-expand  navbar-dark bg-dark shadow-sm top-navigation">
        <div className="container-fluid">
            <Link  className=" d-flex align-items-center" to="/">
                <img src={icon} alt="Logo" width={32} className="me-1 " />
                <span><span className="fw-bold  fs-5 text-primary"> Run</span><span className="text-white fw-bold  fs-5">GPT</span> <span className="small fw-light text-white">{version}</span></span>
            </Link>
    
            {/* <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup"
                aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                <div className="navbar-nav">
                    <Link className="nav-link active" to="/">Home</Link>
                    <Link className="nav-link" to="/setting">Settings</Link>
                    <a className="nav-link" href="toto.html">Nous contacter</a>
                    <a className="nav-link" href="polo.html">A propos</a>
                </div>
            </div> */}
            <div className="d-flex">
                <Link className="btn text-white btn-outline-primary mx-1" to="/connections">
                    <i className="bi bi-plugin"></i>
                </Link>
                <Link className="btn text-white btn-outline-primary mx-1" to="/setting">
                    <i className="bi bi-gear"></i>
                </Link>
            </div>
        </div>
    </nav>
    );
}