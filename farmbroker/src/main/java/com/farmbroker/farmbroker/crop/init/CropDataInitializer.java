package com.farmbroker.farmbroker.crop.init;

import com.farmbroker.farmbroker.crop.domain.Crop;
import com.farmbroker.farmbroker.crop.domain.CropDataSource;
import com.farmbroker.farmbroker.crop.domain.CropDifficulty;
import com.farmbroker.farmbroker.crop.domain.LightRequirement;
import com.farmbroker.farmbroker.crop.repository.CropRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 서버 기동 시 작물 백과사전 시드 데이터(12종)를 1회 적재하는 로더.
// crops 테이블이 비어 있을 때만 삽입하므로 재기동해도 중복되지 않는다.
// 외부 공공 API(농사로) 실시간 연동 대신 시드 데이터로 시작하는 것은 팀 확정 방침 —
// 이후 NONGSARO 배치 적재로 확장한다.
@Component
@RequiredArgsConstructor
public class CropDataInitializer implements ApplicationRunner {

    private final CropRepository cropRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (cropRepository.count() > 0) {
            return;
        }
        cropRepository.saveAll(seedCrops());
    }

    private List<Crop> seedCrops() {
        return List.of(
                crop("상추", "잎채소", 30, CropDifficulty.EASY, 15.0, 22.0, 65.0, LightRequirement.MEDIUM, 3.5, 7000,
                        "저온성 잎채소로 실내 다단 재배에 가장 널리 쓰인다. 재배 기간이 짧고 초기 설비 부담이 낮아 입문용으로 적합하다."),
                crop("로메인", "잎채소", 35, CropDifficulty.EASY, 15.0, 22.0, 65.0, LightRequirement.MEDIUM, 3.0, 8000,
                        "샐러드 수요가 꾸준한 잎채소. 상추와 재배 조건이 비슷해 함께 기르기 좋다."),
                crop("케일", "잎채소", 50, CropDifficulty.NORMAL, 15.0, 25.0, 60.0, LightRequirement.HIGH, 2.5, 10000,
                        "영양가가 높아 주스·샐러드용 수요가 많다. 광량이 충분해야 잎이 두껍게 자란다."),
                crop("루꼴라", "잎채소", 25, CropDifficulty.EASY, 15.0, 22.0, 60.0, LightRequirement.MEDIUM, 2.0, 15000,
                        "재배 기간이 매우 짧고 회전율이 높다. 향이 강해 레스토랑 납품 단가가 좋은 편이다."),
                crop("청경채", "잎채소", 35, CropDifficulty.EASY, 18.0, 23.0, 65.0, LightRequirement.MEDIUM, 3.0, 6000,
                        "수분 관리만 잘하면 실패가 적은 잎채소. 볶음·쌈 수요가 꾸준하다."),
                crop("시금치", "잎채소", 40, CropDifficulty.NORMAL, 10.0, 20.0, 60.0, LightRequirement.MEDIUM, 2.5, 8000,
                        "저온을 선호해 겨울철 실내 재배에 유리하다. 고온에서는 웃자람에 주의해야 한다."),
                crop("바질", "허브", 40, CropDifficulty.NORMAL, 20.0, 28.0, 60.0, LightRequirement.HIGH, 1.5, 30000,
                        "단가가 높고 소규모 공간에서도 재배 효율이 좋은 대표 허브. 고온성이라 보온·광량 관리가 중요하다."),
                crop("민트", "허브", 35, CropDifficulty.EASY, 18.0, 25.0, 60.0, LightRequirement.MEDIUM, 1.8, 25000,
                        "생명력이 강해 초보자도 기르기 쉽다. 음료·디저트용 수요가 꾸준하다."),
                crop("고수", "허브", 30, CropDifficulty.NORMAL, 17.0, 24.0, 60.0, LightRequirement.MEDIUM, 1.5, 20000,
                        "동남아 음식 수요 증가로 단가가 좋아진 허브. 더위에 약해 온도 관리가 필요하다."),
                crop("딸기", "과채류", 90, CropDifficulty.HARD, 15.0, 23.0, 65.0, LightRequirement.HIGH, 2.0, 15000,
                        "수경 재배 프리미엄 작물. 재배 기간이 길고 수분(꽃가루받이)·온도 관리 난도가 높지만 단가가 좋다."),
                crop("방울토마토", "과채류", 75, CropDifficulty.NORMAL, 20.0, 28.0, 65.0, LightRequirement.HIGH, 4.0, 9000,
                        "㎡당 수확량이 많은 과채류. 지주 설치가 필요하고 충분한 광량이 확보돼야 한다."),
                crop("무순", "새싹채소", 7, CropDifficulty.EASY, 18.0, 25.0, 70.0, LightRequirement.LOW, 1.0, 12000,
                        "일주일 만에 수확하는 새싹채소. 광량이 거의 필요 없어 창고형 공간에서도 재배할 수 있다.")
        );
    }

    private Crop crop(String name, String category, int growingPeriodDays, CropDifficulty difficulty,
                      Double tempMin, Double tempMax, Double humidity, LightRequirement light,
                      Double yieldPerSqmKg, Integer avgPricePerKg, String description) {
        return Crop.builder()
                .name(name)
                .category(category)
                .growingPeriodDays(growingPeriodDays)
                .difficulty(difficulty)
                .optimalTempMin(tempMin)
                .optimalTempMax(tempMax)
                .optimalHumidity(humidity)
                .lightRequirement(light)
                .yieldPerSqmKg(yieldPerSqmKg)
                .avgPricePerKg(avgPricePerKg)
                .description(description)
                .dataSource(CropDataSource.SEED)
                .build();
    }
}
