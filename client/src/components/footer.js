import Styled from "styled-components";

// import all image

function Footer() {
  return (
    <Wrapper>
      <div className="border-top">
        <div className="container">
          <div className="footer d-flex flex-wrap justify-content-center align-items-center py-3 my-4 ">
            <div className="col-md-4 d-flex  justify-content-center text-center">
              <p className="mb-3 mb-md-0 text-muted text-center">
                © 2024 DOAGuru InfoSystems, India
              </p>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

export default Footer;

//CSS Styled Section use only low css styled

const Wrapper = Styled.section`


`;
