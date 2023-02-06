import React from 'react';
import { Card, CardContent, makeStyles, Menu, MenuItem, Button, Link } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

const useStyles = makeStyles(theme => ({
    card: {
        display: 'flex',
        width: '125px',
        height: '150px',
        justifyContent: 'center',
        margin: '0 15px 15px 0',
        boxShadow: theme.shadows[1],
        backgroundColor: theme.palette.background.default,
    },
    content: {
        display: 'flex',
        padding: '10px',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'column',
    },
    title: {
        fontSize: '10pt',
        textAlign: 'center',
        fontWeight: 500,
    },
    icon: {
        width: '55%',
    },
    bottom: {
        fontSize: '8pt',
        textAlign: 'center',
        textTransform: 'uppercase',
        display: 'flex',
        alignContent: 'center',
    },
    iconContainer: {
        height: '75px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropdownIcon: {
        fontSize: '14pt',
    },
    line: {
        marginBottom: '5px',
        width: '100%',
        height: '1px',
        border: 0,
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        borderBottom: 0,
    },
}));

interface Link {
    text: string;
    link: string;
}

interface Props {
    title: string;
    image: any;
    linksText?: string;
    links?: Link[];
}

export const Tool = ({ title, image, linksText, links }: Props) => () => {
    const classes = useStyles();


    const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
    const menuOpen = Boolean(menuAnchorEl);
    const handleMenuClick = (event: any) => {
        setMenuAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    let bottomEls: any[] = [];

    switch (links?.length) {
        case 1:
            const [{ text, link }] = links;
            bottomEls = [<Link target="_blank" href={link} key={`tool-link-${title}`}>{text}</Link>]
            break;
        case null:
        case undefined:
            break;
        default:
            bottomEls = [(
                <div key={`tool-bottom-element-buttons-${title}`}>
                    <Button
                        key={`tool-menu-button-${title}`}
                        style={{ height: '20px' }}
                        aria-haspopup="true"
                        aria-expanded={menuOpen ? 'true' : undefined}
                        onClick={handleMenuClick}>
                        <div className={classes.bottom}>{linksText}<ArrowDropDownIcon className={classes.dropdownIcon} key={`tool-menu-button-bottom-${title}`} /></div>
                    </Button>
                    <Menu
                        key={`tool-menu-${title}`}
                        anchorEl={menuAnchorEl}
                        open={menuOpen}
                        onClose={handleMenuClose}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}>
                        {
                            links?.map(({ text, link }: Link) =>
                                <MenuItem onClick={handleMenuClose} key={`tool-menu-item-${title}-${title}`}>
                                    <Link target="_blank" href={link}><div className={classes.bottom}>{text}</div></Link>
                                </MenuItem>)
                        }
                    </Menu>
                </div>)]
            break;
    }

    return (
        <Card className={classes.card} key={`tool-${title}`}>
            <CardContent className={classes.content} key={`tool-content-${title}`}>
            <div className={classes.title} key={`tool-title-${title}`}>{title}</div>
            <hr className={classes.line} key={`tool-line-0-${title}`} />
            <div className={classes.iconContainer} key={`tool-icon-${title}`}>
                <img src={image} className={classes.icon} ></img>
            </div>
            <hr className={classes.line} key={`tool-line-${title}`} />
            <div className={classes.bottom} key={`tool-bottom-buttons-${title}`}>{bottomEls}</div>
        </CardContent>
        </Card >
    );
};