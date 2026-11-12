//! The unread count outside the window: the dock badge on macOS, the launcher badge on Linux
//! (Unity launcher API: KDE, the Ubuntu dock), and on Windows, which has no badge count, an
//! overlay icon on the taskbar button drawn here (a red disc with the number, 9+ past nine).
//! The tray shows it too (tray.rs).

use tauri::{AppHandle, Manager, Runtime};

/// The overlay icon's size: Windows draws taskbar overlays at 16×16.
pub(crate) const OVERLAY_SIZE: u32 = 16;

/// What a badge says: the number, or 9+ where there is room for one digit only.
pub(crate) fn short_label(count: u32) -> String {
    if count > 9 {
        "9+".into()
    } else {
        count.to_string()
    }
}

/// Show the count on the dock, launcher or taskbar button, and in the tray; 0 takes it away.
pub fn show<R: Runtime>(app: &AppHandle<R>, count: u32) {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(any(target_os = "macos", target_os = "linux"))]
        if let Err(e) = window.set_badge_count(if count > 0 { Some(i64::from(count)) } else { None }) {
            log::debug!("badge: {e}");
        }
        #[cfg(windows)]
        {
            let icon = (count > 0).then(|| tauri::image::Image::new_owned(overlay_rgba(count), OVERLAY_SIZE, OVERLAY_SIZE));
            if let Err(e) = window.set_overlay_icon(icon) {
                log::debug!("overlay icon: {e}");
            }
        }
        #[cfg(not(any(target_os = "macos", target_os = "linux", windows)))]
        let _ = window;
    }
    crate::tray::show_count(app, count);
}

/// 3×5 pixel glyphs of the digits and '+', one row per entry, bit 2 on the left.
const GLYPHS: [[u8; 5]; 11] = [
    [0b111, 0b101, 0b101, 0b101, 0b111], // 0
    [0b010, 0b110, 0b010, 0b010, 0b111], // 1
    [0b111, 0b001, 0b111, 0b100, 0b111], // 2
    [0b111, 0b001, 0b111, 0b001, 0b111], // 3
    [0b101, 0b101, 0b111, 0b001, 0b001], // 4
    [0b111, 0b100, 0b111, 0b001, 0b111], // 5
    [0b111, 0b100, 0b111, 0b101, 0b111], // 6
    [0b111, 0b001, 0b010, 0b010, 0b010], // 7
    [0b111, 0b101, 0b111, 0b101, 0b111], // 8
    [0b111, 0b101, 0b111, 0b001, 0b111], // 9
    [0b000, 0b010, 0b111, 0b010, 0b000], // +
];

/// NEO's danger red (red-600): white text on it passes WCAG AA.
const RED: [u8; 4] = [0xDC, 0x26, 0x26, 0xFF];
const WHITE: [u8; 4] = [0xFF, 0xFF, 0xFF, 0xFF];

/// The overlay badge as 16×16 RGBA: a red disc, the count in white, transparent around it.
#[cfg_attr(not(windows), allow(dead_code))]
pub(crate) fn overlay_rgba(count: u32) -> Vec<u8> {
    let size = OVERLAY_SIZE as usize;
    let mut rgba = vec![0u8; size * size * 4];
    let centre = (size as f32 - 1.0) / 2.0;
    let radius = size as f32 / 2.0;
    for y in 0..size {
        for x in 0..size {
            let (dx, dy) = (x as f32 - centre, y as f32 - centre);
            if dx * dx + dy * dy <= radius * radius {
                put(&mut rgba, size, x, y, RED);
            }
        }
    }

    let label = short_label(count);
    let glyphs: Vec<usize> = label.chars().map(|c| c.to_digit(10).map_or(10, |d| d as usize)).collect();
    // each glyph is drawn at twice its size when one fits, at its own size when two do
    let scale = if glyphs.len() == 1 { 2 } else { 1 };
    let width = glyphs.len() * 3 * scale + (glyphs.len() - 1) * scale;
    let height = 5 * scale;
    let left = (size - width) / 2;
    let top = (size - height) / 2;
    for (i, &g) in glyphs.iter().enumerate() {
        let x0 = left + i * 4 * scale;
        for (row, bits) in GLYPHS[g].iter().enumerate() {
            for col in 0..3 {
                if bits & (0b100 >> col) == 0 {
                    continue;
                }
                for sy in 0..scale {
                    for sx in 0..scale {
                        put(&mut rgba, size, x0 + col * scale + sx, top + row * scale + sy, WHITE);
                    }
                }
            }
        }
    }
    rgba
}

/// A copy of an icon with a red dot in its top-right corner: the tray icon while something is unread.
pub(crate) fn with_dot(rgba: &[u8], width: u32, height: u32) -> Vec<u8> {
    let (w, h) = (width as usize, height as usize);
    let mut out = rgba.to_vec();
    if w == 0 || h == 0 || out.len() < w * h * 4 {
        return out;
    }
    let r = (w.min(h) as f32 * 0.22).max(2.0);
    let (cx, cy) = (w as f32 - r - 0.5, r - 0.5);
    for y in 0..h {
        for x in 0..w {
            let (dx, dy) = (x as f32 - cx, y as f32 - cy);
            let d = dx * dx + dy * dy;
            if d <= r * r {
                put(&mut out, w, x, y, RED);
            } else if d <= (r + 1.0) * (r + 1.0) {
                // a ring of clear pixels keeps the dot apart from the icon under it
                put(&mut out, w, x, y, [0, 0, 0, 0]);
            }
        }
    }
    out
}

fn put(rgba: &mut [u8], width: usize, x: usize, y: usize, colour: [u8; 4]) {
    let i = (y * width + x) * 4;
    if let Some(px) = rgba.get_mut(i..i + 4) {
        px.copy_from_slice(&colour);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pixel(rgba: &[u8], width: usize, x: usize, y: usize) -> [u8; 4] {
        let i = (y * width + x) * 4;
        [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]]
    }

    #[test]
    fn labels_have_room_for_one_digit() {
        assert_eq!(short_label(1), "1");
        assert_eq!(short_label(9), "9");
        assert_eq!(short_label(10), "9+");
        assert_eq!(short_label(250), "9+");
    }

    #[test]
    fn overlay_is_a_red_disc_with_white_digits() {
        let size = OVERLAY_SIZE as usize;
        for count in [1, 7, 12] {
            let rgba = overlay_rgba(count);
            assert_eq!(rgba.len(), size * size * 4);
            assert_eq!(pixel(&rgba, size, 0, 0)[3], 0, "corners are clear");
            let colours: Vec<[u8; 4]> = rgba.chunks(4).map(|c| [c[0], c[1], c[2], c[3]]).collect();
            assert!(colours.contains(&RED), "{count}: the disc");
            assert!(colours.contains(&WHITE), "{count}: the digits");
        }
        assert_ne!(overlay_rgba(1), overlay_rgba(7), "each count looks different");
        assert_eq!(overlay_rgba(10), overlay_rgba(99), "past nine they all say 9+");
    }

    #[test]
    fn dot_goes_top_right_and_leaves_the_rest() {
        let (w, h) = (32usize, 32usize);
        let icon = vec![0x80u8; w * h * 4];
        let dotted = with_dot(&icon, w as u32, h as u32);
        assert_eq!(pixel(&dotted, w, w - 4, 4), RED);
        assert_eq!(pixel(&dotted, w, 2, h - 2), [0x80; 4], "the bottom-left is the icon");
        assert_eq!(with_dot(&icon[..10], w as u32, h as u32), icon[..10].to_vec(), "a short buffer comes back as it was");
    }
}
