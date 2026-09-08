#![forbid(unsafe_code)]

use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    log::sol_log_data,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

solana_program::declare_id!("ADBTs2V6QG9VHiZi9ZkhWz7eSDhYW327st6ieLTqeeBQ");

const MAGIC: [u8; 4] = *b"CCV1";
const HEADER_BYTES: usize = 11;
const BOARD_SIZE: u8 = 16;
const MAX_ALIAS_BYTES: usize = 16;
const MAX_NOTE_BYTES: usize = 64;

#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum CookieCanvasError {
    MissingPainter = 1,
    PainterMustSign = 2,
    Truncated = 3,
    UnsupportedVersion = 4,
    CoordinateOutOfRange = 5,
    TextTooLong = 6,
    LengthMismatch = 7,
    InvalidUtf8 = 8,
    InvalidAlias = 9,
    InvalidNote = 10,
}

impl From<CookieCanvasError> for ProgramError {
    fn from(value: CookieCanvasError) -> Self {
        Self::Custom(value as u32)
    }
}

#[derive(Debug, Eq, PartialEq)]
struct Paint<'a> {
    x: u8,
    y: u8,
    red: u8,
    green: u8,
    blue: u8,
    alias: &'a str,
    note: &'a str,
}

fn parse_paint(data: &[u8]) -> Result<Paint<'_>, CookieCanvasError> {
    if data.len() < HEADER_BYTES {
        return Err(CookieCanvasError::Truncated);
    }
    if data[..4] != MAGIC {
        return Err(CookieCanvasError::UnsupportedVersion);
    }

    let x = data[4];
    let y = data[5];
    if x >= BOARD_SIZE || y >= BOARD_SIZE {
        return Err(CookieCanvasError::CoordinateOutOfRange);
    }

    let alias_len = data[9] as usize;
    let note_len = data[10] as usize;
    if alias_len == 0 || alias_len > MAX_ALIAS_BYTES || note_len > MAX_NOTE_BYTES {
        return Err(CookieCanvasError::TextTooLong);
    }
    if data.len() != HEADER_BYTES + alias_len + note_len {
        return Err(CookieCanvasError::LengthMismatch);
    }

    let alias_end = HEADER_BYTES + alias_len;
    let alias = core::str::from_utf8(&data[HEADER_BYTES..alias_end])
        .map_err(|_| CookieCanvasError::InvalidUtf8)?;
    let note = core::str::from_utf8(&data[alias_end..])
        .map_err(|_| CookieCanvasError::InvalidUtf8)?;

    if !alias
        .bytes()
        .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b' ' | b'-' | b'_'))
    {
        return Err(CookieCanvasError::InvalidAlias);
    }
    if note.chars().any(char::is_control) {
        return Err(CookieCanvasError::InvalidNote);
    }

    Ok(Paint {
        x,
        y,
        red: data[6],
        green: data[7],
        blue: data[8],
        alias,
        note,
    })
}

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let painter = accounts
        .first()
        .ok_or(CookieCanvasError::MissingPainter)?;
    if !painter.is_signer {
        return Err(CookieCanvasError::PainterMustSign.into());
    }

    let paint = parse_paint(instruction_data)?;
    msg!(
        "CookieCanvas: ({}, {}) #{:02X}{:02X}{:02X} by {}",
        paint.x,
        paint.y,
        paint.red,
        paint.green,
        paint.blue,
        paint.alias
    );
    // The canonical binary payload is emitted as `Program data:` for explorers and
    // indexers. The note is validated but deliberately not duplicated in plaintext.
    sol_log_data(&[instruction_data]);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn paint(alias: &[u8], note: &[u8]) -> Vec<u8> {
        let mut bytes = vec![b'C', b'C', b'V', b'1', 7, 11, 0xED, 0x92, 0x29];
        bytes.push(alias.len() as u8);
        bytes.push(note.len() as u8);
        bytes.extend_from_slice(alias);
        bytes.extend_from_slice(note);
        bytes
    }

    #[test]
    fn parses_valid_wire_payload() {
        let bytes = paint(b"CrumbArtist", b"adding a chip");
        assert_eq!(
            parse_paint(&bytes),
            Ok(Paint {
                x: 7,
                y: 11,
                red: 0xED,
                green: 0x92,
                blue: 0x29,
                alias: "CrumbArtist",
                note: "adding a chip",
            })
        );
    }

    #[test]
    fn rejects_coordinates_outside_canvas() {
        let mut bytes = paint(b"Painter", b"");
        bytes[4] = BOARD_SIZE;
        assert_eq!(parse_paint(&bytes), Err(CookieCanvasError::CoordinateOutOfRange));
    }

    #[test]
    fn rejects_bad_length_and_alias() {
        let mut bad_length = paint(b"Painter", b"note");
        bad_length[10] = 3;
        assert_eq!(parse_paint(&bad_length), Err(CookieCanvasError::LengthMismatch));

        let bad_alias = paint(b"not@valid", b"");
        assert_eq!(parse_paint(&bad_alias), Err(CookieCanvasError::InvalidAlias));
    }

    #[test]
    fn rejects_control_characters_in_note() {
        let bytes = paint(b"Painter", b"line\nfeed");
        assert_eq!(parse_paint(&bytes), Err(CookieCanvasError::InvalidNote));
    }

    #[test]
    fn program_id_matches_deployment_keypair() {
        assert_eq!(id().to_string(), "ADBTs2V6QG9VHiZi9ZkhWz7eSDhYW327st6ieLTqeeBQ");
    }
}
