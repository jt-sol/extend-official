import {
    CAPTCHA_SITE_KEY, 
} from "../../constants";

import Reaptcha from 'reaptcha';

export const Captcha = (props) => {

    const onVerify = (response) => {
        console.log("response", response);
        props.onVerify(response);
    }
    const onExpire = () => {
        console.log("it fails");
    }
    return (
        <Reaptcha
            sitekey={CAPTCHA_SITE_KEY}
            onVerify={onVerify}
            onExpire={onExpire}
        />
    );
}